export function handle (state, action) {
    const balances = state.balances
    const input = action.input
    const originator = action.originator
    const beneficiary = input.beneficiary
    const divisibility = state.divisibility
  
    if (input.function === 'transfer') {
        if (isNaN(input.qty)) {
            throw new ContractError('Invalid amount.')
        }

        const amount = Math.trunc(parseFloat(input.qty) * divisibility)

        if (!beneficiary) {
            throw new ContractError('No beneficiary specified.')
        }

        if (amount <= 0 || originator === beneficiary) {
            throw new ContractError('Invalid transfer.')
        }

        if (balances[originator] < amount) {
            throw new ContractError(`Originator's balance not high enough to make this transfer.`)
        }

        balances[originator] -= amount
        if (beneficiary in balances) {
            balances[beneficiary] += amount
        } else {
            // Initialize account
            balances[beneficiary] = amount
        }

        return { state }
    }
  
    if (input.function === 'balance') {
        const ticker = state.ticker

        if (typeof beneficiary !== 'string') {
        throw new ContractError('Beneficiary account has a wrong format.')
        }

        if (typeof balances[beneficiary] !== 'number') {
        throw new ContractError('Beneficiary account does not exist.')
        }

        const balance = balances[beneficiary] / divisibility

        return { result: { beneficiary, ticker, balance: balance.toFixed(divisibility), divisibility } }
    }
  
    throw new ContractError(`No function supplied or function not recognised: "${input.function}"`)
}
