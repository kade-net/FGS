import {FunResolver, PaginationArgs, SortOrder} from "./types";
import db, {schema} from "storage";
import {and, asc, desc, eq, gte, sql, count} from "drizzle-orm";
import {ACCEPT, INVITATION, REJECT} from "validation";
import {conversationChannel} from "./commChannel";

enum INVITE_TYPE {
    PENDING = "PENDING",
    REJECTED = "REJECTED",
    ACCEPTED = "ACCEPTED",
}

interface ResolverMap {
    Query: {
        invitations: FunResolver<any,{address: string, type: INVITE_TYPE}, any>
        conversation: FunResolver<any, {conversation_id: string, pagination: PaginationArgs, sort: SortOrder}, any>
        invitation: FunResolver<any, {invitation_id: string}, any>
        lastMessage: FunResolver<any, {conversation_id: string}>
        conversationMonitor: FunResolver<any, {lastCheck: string, conversation_ids: Array<string>}, any>
    },
    Subscription: {
        conversation: {
            subscribe: FunResolver<any, {conversation_id: string}, any>
        }
    }
}

export const queryResolver: ResolverMap = {
   Query: {
        conversation: async (_, args, __)=>{
            const page = args?.pagination?.page ?? 0
            const size = args?.pagination?.size ?? 20
            const sort = args?.sort ?? SortOrder.ASC
            const messages = await db.query.nodeInbox.findMany({
                where(fields, ops){
                    return ops.and(
                        ops.eq(fields.activity_type, 'message'),
                        ops.sql`${schema.nodeInbox.activity} ->> 'conversation_id' = ${args.conversation_id}`
                    )
            },
                orderBy: sort == SortOrder.ASC ?  asc(schema.nodeInbox.recorded) : sort == SortOrder.DESC ? desc(schema.nodeInbox.recorded) : undefined,
                offset: page * size,
                limit: size
            })

            return {
                conversation_id: args.conversation_id,
                messages: messages?.map((m)=>{
                    (m.activity as any)!.published = new Date((m.activity as any)!.published)
                    return m.activity
                })
            }
        },
       lastMessage: async (_, args, __)=>{
            const messages = await db.query.nodeInbox.findMany({
                where(fields, ops) {
                    return ops.and(
                        ops.eq(fields.activity_type, 'message'),
                        ops.sql`${schema.nodeInbox.activity} ->> 'conversation_id' = ${args.conversation_id}`
                    )
                },
                orderBy: desc(schema.nodeInbox.recorded),
                offset: 0,
                limit: 1
            })

           const lastMessage = messages?.at(0)

           if(!lastMessage) return null

           const activity: Record<string, any> = lastMessage.activity as any
           activity.published = new Date((activity)!.published)

           return activity ?? null

       },
        invitations: async (_, args, __)=>{
            const outGoingEvents = await db.query.nodeOutbox.findMany({
                where(fields, ops){
                    return ops.and(
                        ops.or(
                            ops.eq(fields.activity_type, 'invite'),
                            ops.eq(fields.activity_type, 'accept'),
                            ops.eq(fields.activity_type, 'reject')
                        ),
                        ops.sql`${schema.nodeOutbox.activity} ->> 'from' = ${args.address}`
                    )
                },
                orderBy: desc(schema.nodeInbox.recorded)
            })

            console.log("Args ::", args)
            console.log("Outgoing events::", outGoingEvents)

            const incomingEvents = await db.query.nodeInbox.findMany({
                where(fields, ops){
                    return ops.and(
                        ops.or(
                            ops.eq(fields.activity_type, 'invite'),
                            ops.eq(fields.activity_type, 'accept'),
                            ops.eq(fields.activity_type, 'reject')
                        ),
                        ops.sql`${schema.nodeInbox.activity} ->> 'to' = ${args.address}`
                    )
                },
                orderBy: desc(schema.nodeInbox.recorded)
            })

            const allEvents = outGoingEvents.concat(incomingEvents)

            const requestedInvitations = allEvents.reduce((acc, curr)=>{

                if(curr.activity_type !== 'invite'){
                    return acc
                }
                const IS_REJECTED = allEvents.find((e)=> (e.activity as REJECT)?.invitation == curr.id && e.activity_type == 'reject' )
                const IS_ACCEPTED = allEvents.find((e)=> (e.activity as ACCEPT)?.invitation == curr.id && e.activity_type == 'accept')

                if(args.type == INVITE_TYPE.ACCEPTED && IS_ACCEPTED){
                    acc.push(curr.activity as INVITATION)
                    return acc
                }

                if(args.type == INVITE_TYPE.REJECTED && IS_REJECTED){
                    acc.push(curr.activity as INVITATION)
                    return acc
                }

                if(args.type == INVITE_TYPE.PENDING && !IS_ACCEPTED && !IS_REJECTED){
                    acc.push(curr.activity as INVITATION)
                    return acc
                }

                if(!args.type){
                    acc.push(curr.activity as INVITATION)
                    return acc
                }

                return acc
            }, [] as Array<INVITATION>)

            return requestedInvitations?.map(i => {
                return {
                    ...i,
                    published: new Date(i.published)
                }
            })

        },
       invitation: async (_, args, __) => {
            const invitation = (await db.query.nodeInbox.findFirst({
                where(fields, ops){
                    return ops.and(
                        ops.eq(fields.activity_type, 'invite'),
                        ops.eq(fields.id, args.invitation_id)
                    )
                }
            })) ?? (
                await db.query.nodeOutbox.findFirst({
                    where(fields, ops){
                        return ops.and(
                            ops.eq(fields.activity_type, 'invite'),
                            ops.eq(fields.id, args.invitation_id)
                        )
                    }
                })
            )

           return {
                ...(invitation?.activity ?? null),
               published: (invitation?.activity as any)?.published ? new Date((invitation?.activity as any)?.published) : Date.now(),
           }
       },
       conversationMonitor: async (_, args, __)=>{
            const lastCheckTimestamp = parseInt(args.lastCheck)

           const newMessagesCounts = await Promise.all(args?.conversation_ids?.map(async (c)=>{

               try {
                   const countResult = await db.selectDistinct({
                       count: count(schema.nodeInbox.id)
                   }).from(schema.nodeInbox).where(and(
                       sql`${schema.nodeInbox.activity} ->> 'conversation_id' = ${c}`,
                       gte(schema.nodeInbox.recorded, new Date(lastCheckTimestamp)),
                       eq(schema.nodeInbox.activity_type, 'message')
                   ))

                   return countResult?.at(0)?.count ?? 0
               }
               catch (e)
               {
                   console.log("Something went wrong", e)
                   return 0
               }
           }))

           const total = newMessagesCounts.reduce((p, c)=>{
               return p + c
           },0)


           return {
                count: total ?? 0
           }
       }
   },
    Subscription: {
       conversation: {
           subscribe: async (_, args, __) =>{
               return conversationChannel.asyncIterator([`conversation-${args.conversation_id}`])
           }
       }
    }
}