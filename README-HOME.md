# Bank Transaction System (Backend Project)
## Date created - 14th Feb, 2026

## How an Transaction Looks like = 
`transactions {
    from: Sender
    To: Receiver
    Amount: XYZ
    idempotencyKey: String
    Status: Pending
}`

## What is an Ledger?
A type of Register System which contains all the logs of every transaction

`Ledger-A {
    Account: A
    Amount: 100
    Type: Debit
}`

`Ledger-B {
    Account: B
    Amount: 100
    Type: Credit
}`

/**
 * - Create a new Transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check Account Status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send Email notification 
 */