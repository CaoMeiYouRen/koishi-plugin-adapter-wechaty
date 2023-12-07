import { Adapter, Awaitable, Context, Logger, MaybeArray, Session, makeArray } from 'koishi'
import type { WechatyEventListeners } from 'wechaty/src/schemas/mod'
import type { ContactInterface } from 'wechaty/src/user-modules/contact'
import { WechatyBot } from './bot'
import { PassthroughEvents } from './type'
import { adaptContact, adaptMessage, adaptRoom } from './utils'

// 接受消息
export default class WechatyAdapter<C extends Context = Context> extends Adapter<C, WechatyBot<C>> {

    private readonly logger = new Logger(WechatyAdapter.name)

    async connect(bot: WechatyBot<C>) {
        this.logger.debug('connect')
        bot.initialize()
        this.loadEvents(bot)
        this.emitWechatyEvent(bot)
        await bot.internal.start()
        bot.online()
        bot.loginTime = Date.now()
    }

    async disconnect(bot: WechatyBot<C>) {
        this.logger.debug('disconnect')
        await bot.internal.stop()
        bot.offline()
    }

    private adaptEvent<K extends keyof WechatyEventListeners>(
        bot: WechatyBot<C>,
        event: K,
        sessionBuilder: (
            ...args: Parameters<WechatyEventListeners[K]>
        ) => Awaitable<MaybeArray<Partial<Session>>>) {
        bot.internal.on(event, async (...args: any[]) => {
            const timestamp = Date.now()
            const payloads = makeArray(
                await sessionBuilder(...(args as Parameters<WechatyEventListeners[K]>)),
            )
            payloads.forEach(async (payload) => {
                if (!payload) {
                    return
                }
                payload.timestamp ??= timestamp
                // this.logger.debug('payload', payload)
                const session = bot.session(payload as any)
                // Object.assign(session, {
                //   ...payload
                // })
                if (payload.content && !session.content) {
                    session.content = payload.content
                }
                if (payload.messageId && !session.messageId) {
                    session.messageId = payload.messageId
                }
                this.logger.debug('session', session)
                if (
                    session?.type === 'message' &&
          (session.timestamp ?? Date.now()) - bot.loginTime < 1000 * 2 // 弃用机器人启动之前的消息，避免刷屏
                ) {
                    // this.logger.debug('session 已过时, content: %s', session.content)
                    return
                }
                bot.dispatch(session)
            })
        })
    }

    private loadEvents(bot: WechatyBot<C>) {
        this.adaptEvent(bot, 'message', async (message) => {
            this.logger.debug('message', message)
            const adaptedMessage = await adaptMessage(bot, message)
            if (!adaptedMessage) {
                return
            }
            let messageType = 'message'
            if ( message.type() === bot.internal.Message.Type.Recalled) {
                messageType = 'message-deleted'
            } else if (adaptedMessage.user.id === bot.selfId) {
                messageType = 'message-sent'
            }
            return {
                ...adaptedMessage,
                type: messageType,
            } as any
        })
        this.adaptEvent(bot, 'friendship', async (friendship) => {
            const wechatyType = friendship.type()
            let type: string
            if (wechatyType === 2) {
                // receive
                type = 'friend-request'
            } else if (wechatyType === 1) {
                // confirm
                type = 'friend-added'
            } else {
                return
            }
            const channelId = `private:${friendship.contact().id}`
            return {
                type,
                id: friendship.id,
                messageId: friendship.id,
                content: friendship.hello(),
                channelId,
                channel: {
                    id: channelId,
                },
                user: await adaptContact(friendship.contact()),
            } as any
        })
        this.adaptEvent(bot, 'room-invite', async (invitation) => {
            const channelName = await invitation.topic()
            return {
                type: 'guild-request',
                id: invitation.id,
                messageId: invitation.id,
                user: await adaptContact(await invitation.inviter()),
                channel: {
                    id: channelName,
                    name: channelName,
                },
                channelName,
                channelId: channelName,
                guild: {
                    id: channelName,
                    name: channelName,
                },
                guildName: channelName,
                guildId: channelName,
            } as any
        })
        this.adaptEvent(
            bot,
            'room-join',
            async (
                room,
                inviteeList: ContactInterface[],
                inviter: ContactInterface,
                date: Date,
            ) => {
                const channel = await adaptRoom(room)
                const timestamp = (date || new Date()).valueOf()
                const sessions = await Promise.all(
                    inviteeList.map(async (invitee): Promise<Partial<Session>> => {
                        const invitedUser = await adaptContact(invitee)
                        return {
                            type: invitee.self() ? 'guild-added' : 'guild-member-added',
                            subtype: invitedUser.id === inviter.id ? 'active' : 'passive',
                            ...invitedUser,
                            targetId: invitedUser.id,
                        } as any
                    }),
                )
                return sessions.map((s) => ({
                    operatorId: inviter.id,
                    timestamp,
                    ...channel,
                    ...s,
                })) as any
            },
        )
        this.adaptEvent(
            bot,
            'room-leave',
            async (
                room,
                leaverList: ContactInterface[],
                operator: ContactInterface,
                date: Date,
            ) => {
                const channel = await adaptRoom(room)
                const timestamp = (date || new Date()).valueOf()
                const sessions = await Promise.all(
                    leaverList.map(async (leaver): Promise<Partial<Session>> => {
                        const user = await adaptContact(leaver)
                        return {
                            type: leaver.self() ? 'guild-deleted' : 'guild-member-deleted',
                            subtype:
                !operator || user.id === operator.id ? 'active' : 'passive',
                            targetId: user.id,
                            ...user,
                        } as any
                    }),
                )
                return sessions.map((s) => ({
                    ...channel,
                    operatorId: operator?.id,
                    timestamp,
                    ...s,
                })) as any
            },
        )
    }

    /**
   * 向全局广播 wechaty/* 事件
   *
   * @author CaoMeiYouRen
   * @date 2023-12-06
   * @private
   */
    private emitWechatyEvent(bot: WechatyBot<C>) {
        for (const event of PassthroughEvents) {
            bot.internal.on(event, (...args: any) => {
                const session = bot.session()
                session.type = `wechaty/${event}`
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                session.app.emit(session, `wechaty/${event}`, session, ...args)
            })
        }
    }
}
