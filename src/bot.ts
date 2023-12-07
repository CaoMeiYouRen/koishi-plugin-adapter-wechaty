import os from 'os'
import { Bot, Context, Fragment, Logger, Schema, Random } from 'koishi'
import { WechatyBuilder, WechatyOptions } from 'wechaty'
import qrcodeTerminal from 'qrcode-terminal'
import type { SendOptions } from '@satorijs/protocol'
import { WechatyInstance } from './type'
import WechatyAdapter from './adapter'
import { adaptMessage, adaptContact, adaptRoom, fileBoxToUrl } from './utils'
import { WechatyMessenger } from './message'

// 发送消息
export class WechatyBot<C extends Context = Context> extends Bot<C, WechatyBot.Config> {

    // static MessageEncoder = WechatyMessenger

    readonly logger = new Logger(WechatyBot.name)

    readonly internal: WechatyInstance

    loginTime: number

    constructor(ctx: C, config: WechatyBot.Config) {
        super(ctx, config)
        this.platform = 'wechaty'
        // this.logger.debug(this.config)
        this.internal = WechatyBuilder.build(this.config)
        ctx.plugin(WechatyAdapter, this)
    }

    // async start() {
    //   this.logger.debug('start')
    //   this.init()
    //   await this.internal.start()
    //   this.online()
    // }

    // async stop() {
    //   this.logger.debug('stop')
    //   await this.internal.stop()
    //   this.offline()
    // }

    async sendMessage(
        channelId: string,
        content: Fragment,
        guildId?: string,
        options?: SendOptions,
    ) {
        return (await new WechatyMessenger(this, channelId, guildId, options)
            .send(content)).map((e) => e.id)
    }

    async sendPrivateMessage(
        userId: string,
        content: Fragment,
        guildId?: string,
        options?: SendOptions,
    ) {
        return (await new WechatyMessenger(
            this,
            `private:${userId}`,
            guildId,
            options,
        ).send(content)).map((e) => e.id)
    }
    async getMessage(channelId: string, messageId: string) {
        const message = await this.internal.Message.find({ id: messageId })
        if (!message) {
            return
        }
        return adaptMessage(this, message as any)
    }
    async getMessageList(channelId: string, next?: string) {
        const messages = await this.internal.Message.findAll({
            roomId: !channelId.startsWith('private:') ? channelId : undefined,
            fromId: channelId.startsWith('private:') ? channelId.slice(8) : undefined,
        })
        return {
            data: await Promise.all(messages.map((m) => adaptMessage(this, m as any))),
            next,
        }
    }
    async editMessage(channelId: string, messageId: string, content: any) {
    }

    async deleteMessage(channelId: string, messageId: string) {
    }

    // user
    async getSelf() {
        const self = this.internal.currentUser
        return adaptContact(self)
    }
    async getUser(userId: string) {
        const contact = await this.internal.Contact.find({ id: userId })
        return adaptContact(contact)
    }
    async getFriendList() {
        const friends = await this.internal.Contact.findAll()
        return {
            data: await Promise.all(friends.map(adaptContact)),
        }
    }
    async deleteFriend(userId: string) { }

    // guild
    async getGuild(guildId: string) {
        const room = await this.internal.Room.find({ id: guildId })
        return adaptRoom(room)
    }

    async getGuildList() {
        const rooms = await this.internal.Room.findAll()
        return {
            data: await Promise.all(rooms.map(adaptRoom)),
        }
    }

    async getChannel(channelId: string) {
        return this.getGuild(channelId)
    }

    async getChannelList() {
        return this.getGuildList()
    }

    async muteChannel(channelId: string, guildId?: string, enable?: boolean) { }

    // guild member
    async getGuildMember(guildId: string, userId: string) {
        const room = await this.internal.Room.find({ id: guildId })
        if (!room) {
            return
        }
        const members = await room.memberAll()
        const member = members.find((m) => m.id === userId)
        if (!member) {
            return
        }
        return adaptContact(member)
    }

    async getGuildMemberList(guildId: string) {
        const room = await this.internal.Room.find({ id: guildId })
        if (!room) {
            return
        }
        const members = await room.memberAll()
        return {
            data: await Promise.all(members.map(adaptContact)),
        }
    }
    async kickGuildMember(guildId: string, userId: string, permanent?: boolean) { }

    async muteGuildMember(
        guildId: string,
        userId: string,
        duration: number,
        reason?: string,
    ) { }

    // request
    async handleFriendRequest(
        messageId: string,
        approve: boolean,
        comment?: string,
    ) {
        if (!approve) {
            return
        }
        return this.internal.Friendship.load(messageId).accept()
    }

    async handleGuildRequest(
        messageId: string,
        approve: boolean,
        comment?: string,
    ) {
        if (!approve) {
            return
        }
        return this.internal.RoomInvitation.load(messageId).accept()
    }

    async handleGuildMemberRequest(
        messageId: string,
        approve: boolean,
        comment?: string,
    ) { }

    /**
   * 初始化事件监听
   *
   * @author CaoMeiYouRen
   * @date 2023-12-06
   * @private
   */
    initialize() {
        this.loginTime = Date.now()
        this.internal.on('login', async (user) => {
            this.logger.debug('user', user)
            this.selfId = user.id
            this.user = this.user || ({} as any)
            this.user.name = user.name()
            this.user.avatar = await (await user.avatar()).toDataURL() // await fileBoxToUrl(await user.avatar()) //
            this.online()
        })
        this.internal.on('logout', () => {
            this.offline()
        })
        this.internal.on('error', (error) => {
            this.offline(error)
        })
        this.internal.on('scan', (qrcode, status) => {
            qrcodeTerminal.generate(qrcode, { small: false }, (img) => this.logger?.info(
                `Scan (${status}): https://wechaty.js.org/qrcode/${encodeURIComponent(
                    qrcode,
                )}\n${img}`,
            ),
            )
        })

    }

}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace WechatyBot {
    export interface Config {
        name: string
        puppet: WechatyOptions['puppet']
        puppetOptions?: any
        selfId?: string
        ioToken?: string
    }

    export const Config: Schema<Config> = Schema.object({
        name: Schema.string().required().default(`wechaty-${Random.int(0, 1000).toFixed(0).padStart(4, '0')}`).description('Wechaty 配置文件保存名称。启用多个插件实例时不可重复'),
        puppet: Schema.union(['wechaty-puppet-wechat']).default('wechaty-puppet-wechat').description('Wechaty 使用的 Puppet。').hidden(os.platform() !== 'win32') as Schema<WechatyOptions['puppet']>,
        puppetOptions: Schema.object({ uos: Schema.boolean().default(true) }).description('Wechaty Puppet 选项。').hidden(),
        selfId: Schema.string().description('机器人自身 ID'),
        ioToken: Schema.string().description('Io TOKEN，详见 https://wechaty.js.org/docs/puppet-services/tokens?_highlight=token#get-a-token'),
    })
}
