// const transactionModel = require("../models/transaction.model")
// const ledgerModel = require("../models/ledger.model")
// const accountModel = require("../models/account.model")
// const emailService = require("../services/email.service")
// const mongoose = require("mongoose")

// /**
//  * - Create a new transaction
//  * THE 10-STEP TRANSFER FLOW:
//      * 1. Validate request
//      * 2. Validate idempotency key
//      * 3. Check account status
//      * 4. Derive sender balance from ledger
//      * 5. Create transaction (PENDING)
//      * 6. Create DEBIT ledger entry
//      * 7. Create CREDIT ledger entry
//      * 8. Mark transaction COMPLETED
//      * 9. Commit MongoDB session
//      * 10. Send email notification
//  */

// async function createTransaction(req, res) {

//     /**
//      * 1. Validate request
//      */
//     const { fromAccount, toAccount, amount, idempotencyKey } = req.body

//     if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
//         return res.status(400).json({
//             message: "FromAccount, toAccount, amount and idempotencyKey are required"
//         })
//     }

//     const fromUserAccount = await accountModel.findOne({
//         _id: fromAccount,
//     })

//     const toUserAccount = await accountModel.findOne({
//         _id: toAccount,
//     })

//     if (!fromUserAccount || !toUserAccount) {
//         return res.status(400).json({
//             message: "Invalid fromAccount or toAccount"
//         })
//     }

//     /**
//      * 2. Validate idempotency key
//      */

//     const isTransactionAlreadyExists = await transactionModel.findOne({
//         idempotencyKey: idempotencyKey
//     })

//     if (isTransactionAlreadyExists) {
//         if (isTransactionAlreadyExists.status === "COMPLETED") {
//             return res.status(200).json({
//                 message: "Transaction already processed",
//                 transaction: isTransactionAlreadyExists
//             })

//         }

//         if (isTransactionAlreadyExists.status === "PENDING") {
//             return res.status(200).json({
//                 message: "Transaction is still processing",
//             })
//         }

//         if (isTransactionAlreadyExists.status === "FAILED") {
//             return res.status(500).json({
//                 message: "Transaction processing failed, please retry"
//             })
//         }

//         if (isTransactionAlreadyExists.status === "REVERSED") {
//             return res.status(500).json({
//                 message: "Transaction was reversed, please retry"
//             })
//         }
//     }

//     /**
//      * 3. Check account status
//      */

//     if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
//         return res.status(400).json({
//             message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
//         })
//     }

//     /**
//      * 4. Derive sender balance from ledger
//      */
//     const balance = await fromUserAccount.getBalance()

//     if (balance < amount) {
//         return res.status(400).json({
//             message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
//         })
//     }

//     let transaction;
//     // Attempt to use transactions; if server doesn't support them (standalone), fall back to non-transactional writes
//     let session = null
//     let usingSession = false
//     try {
//         try {
//             session = await mongoose.startSession()
//             // startTransaction may throw on standalone servers
//             session.startTransaction()
//             usingSession = true
//         } catch (err) {
//             // If transactions are not supported, continue without session
//             if (err && err.message && err.message.includes("Transaction numbers are only allowed")) {
//                 usingSession = false
//             } else {
//                 throw err
//             }
//         }

//         const createOpts = usingSession ? { session } : undefined

//         /**
//          * 5. Create transaction (PENDING)
//          */
//         if (usingSession) {
//             transaction = (await transactionModel.create([ {
//                 fromAccount,
//                 toAccount,
//                 amount,
//                 idempotencyKey,
//                 status: "PENDING"
//             } ], createOpts))[0]

//             await ledgerModel.create([ {
//                 account: fromAccount,
//                 amount: amount,
//                 transaction: transaction._id,
//                 type: "DEBIT"
//             } ], createOpts)

//             await (() => {
//                 return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
//             })()

//             await ledgerModel.create([ {
//                 account: toAccount,
//                 amount: amount,
//                 transaction: transaction._id,
//                 type: "CREDIT"
//             } ], createOpts)

//             await transactionModel.findOneAndUpdate(
//                 { _id: transaction._id },
//                 { status: "COMPLETED" },
//                 createOpts
//             )

//             await session.commitTransaction()
//             session.endSession()
//         } else {
//             // Fallback path for standalone MongoDB: perform sequential non-transactional writes
//             transaction = (await transactionModel.create([ {
//                 fromAccount,
//                 toAccount,
//                 amount,
//                 idempotencyKey,
//                 status: "PENDING"
//             } ]))[0]

//             await ledgerModel.create([ {
//                 account: fromAccount,
//                 amount: amount,
//                 transaction: transaction._id,
//                 type: "DEBIT"
//             } ])

//             await (() => {
//                 return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
//             })()

//             await ledgerModel.create([ {
//                 account: toAccount,
//                 amount: amount,
//                 transaction: transaction._id,
//                 type: "CREDIT"
//             } ])

//             transaction.status = "COMPLETED"
//             await transaction.save()
//         }

//     } catch (error) {
//         if (session) {
//             try { await session.abortTransaction() } catch (e) {}
//             try { session.endSession() } catch (e) {}
//         }

//         return res.status(400).json({
//             message: "Transaction is Pending due to some issue, please retry after sometime",
//         })
//     }
//     /**
//      * 10. Send email notification
//      */
//     await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

//     return res.status(201).json({
//         message: "Transaction completed successfully",
//         transaction: transaction
//     })

// }

// async function createInitialFundsTransaction(req, res) {
//     const { toAccount, amount, idempotencyKey } = req.body

//     if (!toAccount || !amount || !idempotencyKey) {
//         return res.status(400).json({
//             message: "toAccount, amount and idempotencyKey are required"
//         })
//     }

//     const toUserAccount = await accountModel.findOne({
//         _id: toAccount,
//     })

//     if (!toUserAccount) {
//         return res.status(400).json({
//             message: "Invalid toAccount"
//         })
//     }

//     const fromUserAccount = await accountModel.findOne({
//         user: req.user._id
//     })

//     if (!fromUserAccount) {
//         return res.status(400).json({
//             message: "System user account not found"
//         })
//     }


//     // Try using transactions, otherwise fall back to non-transactional writes
//     let session = null
//     let usingSession = false
//     try {
//         try {
//             session = await mongoose.startSession()
//             session.startTransaction()
//             usingSession = true
//         } catch (err) {
//             if (err && err.message && err.message.includes("Transaction numbers are only allowed")) {
//                 usingSession = false
//             } else {
//                 throw err
//             }
//         }

//         const transaction = new transactionModel({
//             fromAccount: fromUserAccount._id,
//             toAccount,
//             amount,
//             idempotencyKey,
//             status: "PENDING"
//         })

//         if (usingSession) {
//             await ledgerModel.create([ {
//                 account: fromUserAccount._id,
//                 amount: amount,
//                 transaction: transaction._id,
//                 type: "DEBIT"
//             } ], { session })

//             await ledgerModel.create([ {
//                 account: toAccount,
//                 amount: amount,
//                 transaction: transaction._id,
//                 type: "CREDIT"
//             } ], { session })

//             transaction.status = "COMPLETED"
//             await transaction.save({ session })

//             await session.commitTransaction()
//             session.endSession()
//         } else {
//             await ledgerModel.create([ {
//                 account: fromUserAccount._id,
//                 amount: amount,
//                 transaction: transaction._id,
//                 type: "DEBIT"
//             } ])

//             await ledgerModel.create([ {
//                 account: toAccount,
//                 amount: amount,
//                 transaction: transaction._id,
//                 type: "CREDIT"
//             } ])

//             transaction.status = "COMPLETED"
//             await transaction.save()
//         }
        
//         return res.status(201).json({
//             message: "Initial funds transaction completed successfully",
//             transaction: transaction
//         })
//     } catch (err) {
//         if (session) {
//             try { await session.abortTransaction() } catch (e) {}
//             try { session.endSession() } catch (e) {}
//         }
//         return res.status(500).json({ message: 'Failed to process initial funds transaction' })
//     }


// }

// module.exports = {
//     createTransaction,
//     createInitialFundsTransaction
// }


const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req, res) {

    /**
     * 1. Validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2. Validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })

        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    let transaction;
    try {


        /**
         * 5. Create transaction (PENDING)
         */
        const session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session }))[ 0 ]

        const debitLedgerEntry = await ledgerModel.create([ {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        await (() => {
            return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
        })()

        const creditLedgerEntry = await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )


        await session.commitTransaction()
        session.endSession()
    } catch (error) {

        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })

    }
    /**
     * 10. Send email notification
     */
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })

}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })


}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
