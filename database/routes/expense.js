import express from "express";
import Expense from "../Expense.js";
import { createUpdateBalancesTransaction } from "../utils/solana.js";


const router = express.Router();

router.post("/newExpense", async (req, res) => {
    try {
        const {group, name, description, totalCost, payee, payers, amounts} = req.body;

        // Filter out zero amounts and their corresponding payers
        const nonZeroIndices = amounts.map((amount, index) => ({ amount, index }))
            .filter(item => item.amount > 0);
        
        
        if (payers.length === 0) {
            return res.status(400).json({message: "At least one payer must have a non-zero amount"});
        }

        amounts = nonZeroIndices.map(item => item.amount);
        payers = nonZeroIndices.map(item => payers[item.index]);

        if (!group || !name || !description || !totalCost || !payee || !payers || !amounts) {
            return res.status(400).json({message: "Missing required fields"});
        }

        const existingExpense = await Expense.findOne({ name, group });
        if (existingExpense) {
            return res.status(400).json({message: "Expense with this name already exists in the group"});
        }

        if (Number.isNaN(totalCost) || totalCost <= 0) {
            return res.status(400).json({message: "Total cost must be a positive number"});
        }
        
        if (!Array.isArray(payers) || !Array.isArray(amounts)) {
            return res.status(400).json({message: "Payers and amounts must be arrays"});
        }

        if (payers.length < 1 || amounts.length < 1) {
            return res.status(400).json({message: "Payers and amounts arrays must not be empty"});
        }
        
        if (payers.length != amounts.length) {
            return res.status(400).json({message: "Payers and amounts arrays must have the same length"});
        }

        const payeeUser = await User.findOne({ owner: payee });
        if (!payeeUser) {
            return res.status(400).json({message: "Payee user not found"});
        }

        for (const payer of payers) {
            const payerUser = await User.findOne({ owner: payer });
            if (!payerUser) {
                return res.status(400).json({message: `Payer ${payer} not found`});
            }
        }

        if (payee !== payers[0]) {
            return res.status(400).json({message: "Payee must be the first payer"});
        }

        for (const amount of amounts) {
            if (Number.isNaN(amount) || amount < 0) {
                return res.status(400).json({message: "All amounts must be nonnegative numbers"});
            }
        }
        const decimalAmounts = amounts.map(amount => new Decimal128(amount));

        const amountSum = amounts.reduce((sum, amount) => sum + amount, 0);
        if (amountSum !== totalCost) {
            return res.status(400).json({message: "Sum of amounts must equal total cost"});
        }
        
        const totalCostDecimal = new Decimal128(totalCost);
        const newExpense = new Expense({
            group,
            name,
            description,
            totalCost: totalCostDecimal,
            payee,
            payers,
            amounts: decimalAmounts
        });
        await newExpense.save();
        // res.status(201).json({message: "Expense created successfully", expense: newExpense});

        try {
            const { transaction, backendPublicKey } = await createUpdateBalancesTransaction(
                group,
                totalCost,
                payers,
                amounts
            );

            res.status(201).json({
                message: "Expense and transaction created successfully",
                expense: newExpense,
                transaction,
                backendPublicKey
            })

        } catch (solanaError) {
            console.error('Error in creating Solana transaction:', solanaError);
            res.status(500).json({message: "Solana transaction failed"});
        }

    } catch (error) {
        console.error('Error in expense creation:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

export default router;

