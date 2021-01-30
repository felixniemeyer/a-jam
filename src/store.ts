import { reactive, provide, inject } from 'vue'

export const stateSymbol = Symbol('state')
export const     createState = () => reactive({
    initialized: false,
    //blabla = undefined, // in order to make it reactive
})
export const useState = () => inject(stateSymbol)
export const provideState = () => provide(stateSymbol, createState)
