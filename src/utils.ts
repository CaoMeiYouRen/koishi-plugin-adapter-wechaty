import path from 'path'
import { segment, Universal, Element, Awaitable, Logger } from 'koishi'
import type { ContactInterface } from 'wechaty/src/user-modules/contact'
import type { RoomInterface } from 'wechaty/src/user-modules/room'
import type { MessageInterface } from 'wechaty/src/user-modules/message'
import FileType from 'file-type'
import mime2ext from 'mime2ext'
import { FileBox } from 'file-box'
import WechatyBot from './index'

export type ContactLike = Pick<
ContactInterface,
'id' | 'name' | 'avatar' | 'self'
>
export type FileBoxLike = Awaited<ReturnType<ContactLike['avatar']>>

export type RoomLike = Pick<RoomInterface, 'id' | 'topic'>
export type MessageLike = MessageInterface

export const fileBoxToUrl = async (file: FileBoxLike): Promise<string> => {
    if (!file) {
        return undefined
    }
    if (file['remoteUrl']) {
        return file['remoteUrl']
    }
    let buf: Buffer
    try {
        buf = await file.toBuffer()
    } catch (e) {
        buf = file['stream']
    }
    const fileType = await FileType.fromBuffer(buf)
    const mime = fileType ? fileType.mime : 'application/octet-stream'
    return `data:${mime};base64,${buf.toString('base64')}`
}

export const adaptContact = async (
    contact: ContactLike,
): Promise<Universal.User> => ({
    id: contact.id,
    userId: contact.id,
    nickname: contact.name(),
    avatar: await fileBoxToUrl(await contact.avatar()), // await (await contact.avatar()).toDataURL(),
    isBot: contact.self(),
})

export const adaptRoom = async (
    room: RoomLike,
): Promise<Universal.Channel & Universal.Guild> => {
    const name = await room.topic()

    return {
        id: room.id,
        name,
        type: 0,
    }
}

async function extractMessageURL(
    message: MessageLike,
    segmentFactory: (url: string, name: string) => Awaitable<Element>,
): Promise<Element> {
    const file = await message.toFileBox()
    if (!file) {
        return
    }
    return segmentFactory(await fileBoxToUrl(file), file.name)
}

export async function messageToElement(
    bot: WechatyBot,
    message: MessageLike,
): Promise<Element[]> {
    try {
        const MessageType = bot.internal.Message.Type
        const elements: Element[] = []
        const mentions = await message.mentionList()
        switch (message.type()) {
            case MessageType.Recalled:
                return []
            case MessageType.Text:{
                let text = message.text()
                for (const mention of mentions) {
                    const name = mention.name()
                    text = text.replace(new RegExp(`@${name}\\s+`, 'g'), '')
                }
                elements.push(segment.text(text))
                break
            }
            case MessageType.Image:
                elements.push(
                    await extractMessageURL(message, async (url, name) => segment.image(url, { file: await autoFilename(url) }),
                    ),
                )
                break
            case MessageType.Audio:
                elements.push(
                    await extractMessageURL(message, async (url, name) => segment.audio(url, { file: await autoFilename(url) }),
                    ),
                )
                break
            case MessageType.Video:
                elements.push(
                    await extractMessageURL(message, async (url, name) => segment.video(url, { file: await autoFilename(url) }),
                    ),
                )
                break
            case MessageType.Attachment:
                elements.push(
                    await extractMessageURL(message, async (url, name) => segment.file(url, { file: name }),
                    ),
                )
                break
            case MessageType.Url:{
                const link = await message.toUrlLink()
                elements.push(
                    segment('a', { href: link.url() }, [
                        `${link.title()}\n${link.description}`,
                        segment.image(link.thumbnailUrl()),
                    ]),
                )
                break
            }
            case MessageType.Contact:{
                const contact = await message.toContact()
                elements.push(
                    segment('wechaty:contact', { id: contact.id, name: contact.name() }),
                )
                break
            }
            default:
                return
        }
        mentions.forEach((mention) => elements.unshift(segment.at(mention.id)))
        return elements
    } catch (e) {
        console.error(e)
    }
}

export async function adaptMessage(
    bot: WechatyBot,
    message: MessageLike,
): Promise<Universal.Message> {
    const elements = await messageToElement(bot, message)
    if (!elements) {
        return
    }
    const room = message.room()
    const from = message.talker()
    if (!from) {
        return
    }
    const user = await adaptContact(from as any)
    const channel = room ? await adaptRoom(room as any) : {
        id: `private:${user.id}`,
        type: 0,
    }
    return {
        id: message.id,
        messageId: message.id,
        user,
        channel,
        guild: channel,
        elements: elements as unknown as Universal.Message['elements'],
        content: elements.map((e) => e.toString()).join(''),
        timestamp: (message.date() || new Date()).valueOf(),
        createdAt: (message.date() || new Date()).valueOf(),
    }
}

export async function autoFilename(url: string) {
    if (url.startsWith('file://')) {
        return path.basename(url.slice(7))
    }
    if (url.startsWith('base64://')) {
        const buf = Buffer.from(url.slice(9), 'base64')
        const type = await FileType.fromBuffer(buf)
        return `file.${type.ext}`
    }
    if (url.startsWith('data:')) {
        const [, mime, base64] = url.match(/^data:([^;]+);base64,(.+)$/)
        const ext = mime2ext(mime)
        if (ext) {
            return `file.${ext}`
        }
        const buf = Buffer.from(base64, 'base64')
        const type = await FileType.fromBuffer(buf)
        return `file.${type?.ext || 'bin'}`
    }
    return path.basename(new URL(url).pathname)
}

export const elementToFileBox = async (element: Element) => {
    const { attrs } = element
    const { url, file } = attrs
    if (!url) {
        return
    }
    if (url.startsWith('file://')) {
        const filePath = url.slice(7)
        return FileBox.fromFile(filePath, file || await autoFilename(url))
    }
    if (url.startsWith('base64://')) {
        return FileBox.fromBase64(url.slice(9), file || await autoFilename(url))
    }
    if (url.startsWith('data:')) {
        const [, mime, base64] = url.match(/^data:([^;]+);base64,(.+)$/)
        const ext = mime2ext(mime) || 'bin'
        return FileBox.fromBase64(base64, file || `file.${ext}`)
    }
    return FileBox.fromUrl(url, {
        name: file || await autoFilename(url),
    })
}
