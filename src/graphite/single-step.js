//@flow
// import invariant from 'invariant'
import type {SingleStepValidContext} from '../effector/index.h'
import * as Ctx from 'effector/datatype/context'
import * as Step from 'effector/datatype/step'
import * as Cmd from 'effector/datatype/cmd'

function stepArg(ctx: SingleStepValidContext) {
 switch (ctx.type) {
  case Ctx.EMIT:
   return ctx.data.payload
  case Ctx.COMPUTE:
   return ctx.data.result
  case Ctx.FILTER:
  case Ctx.UPDATE:
   return ctx.data.value
  default:
   throw new Error('RunContext is not supported')
 }
}
export function singleStep(
 single: Cmd.Cmd,
 ctx: SingleStepValidContext,
 transactions: Set<() => void>,
 // buffers: {
 //  sideEffects: Array<Ctx.RunContext>,
 //  updates: Map<Atom<any>, Array<Ctx.UpdateContext>>,
 //  // computations:
 // },
): SingleStepValidContext | Ctx.RunContext | void {
 const arg = stepArg(ctx)
 if (ctx.type === Ctx.FILTER && !ctx.data.isChanged) return
 switch (single.type) {
  case Cmd.EMIT: {
   return new Ctx.EmitContext({
    payload: arg,
    eventName: single.data.fullName,
   })
  }
  case Cmd.FILTER: {
   try {
    const isChanged = single.data.filter(arg, ctx)
    return new Ctx.FilterContext({value: arg, isChanged})
   } catch (err) {
    console.error(err)
    return
   }
  }
  case Cmd.RUN: {
   const transCtx = single.data.transactionContext
   if (transCtx) transactions.add(transCtx(arg))
   try {
    single.data.runner(arg)
   } catch (err) {
    console.error(err)
   }
   return new Ctx.RunContext({args: [arg], parentContext: ctx})
  }
  case Cmd.UPDATE: {
   const newCtx = new Ctx.UpdateContext({value: arg})
   single.data.store.set(arg)
   return newCtx
  }
  case Cmd.COMPUTE: {
   const newCtx = new Ctx.ComputeContext({
    args: [undefined, arg, ctx],
    result: null,
    error: null,
    isError: false,
    isNone: true,
    isChanged: true,
   })
   try {
    const result = single.data.reduce(undefined, arg, newCtx)
    newCtx.data.result = result
    newCtx.data.isNone = result === undefined
   } catch (err) {
    newCtx.data.isError = true
    newCtx.data.error = err
    newCtx.data.isChanged = false
   }
   if (!newCtx.data.isChanged) return
   return newCtx
  }
  default:
   /*::(single.type: empty)*/
   throw new Error('impossible case')
 }
}
