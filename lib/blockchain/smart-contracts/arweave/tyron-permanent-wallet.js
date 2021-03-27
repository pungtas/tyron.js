export function handle (state, action) {
    const input = action.input
    const id = input.id
    const key = input.key

    if (state.owner !== action.caller) {
        throw new ContractError('Wrong caller.')
    }
    
    if (typeof id !== 'string' || id < 3) {
        throw new ContractError(`Invalid ID: ${id}.`)
    }

    if (typeof key !== 'string') {
        throw new ContractError(`Invalid key: ${key}.`)
    }

    if (input.function === 'register') {
        if (state.keys[id]) {
            throw new ContractError('Key ID already registered.')
        }
        state.keys[id] = key
        
        return { state }
    }
  
    if (input.function === 'update') {
        if (!state.keys[id]) {
            throw new ContractError('Key ID not registered.')
        }
        state.keys[id] = key
        
        return { state }
    }

    if (input.function === 'delete') {
        if (!state.keys[id]) {
            throw new ContractError('Key ID not registered.')
        }
        delete state.keys[id]
        return { state }
    }

    throw new ContractError(`No function supplied or function not recognised: "${input.function}"`)
}
