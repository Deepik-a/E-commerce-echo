const walletSchema = require('../../model/walletSchema');

// --------------------------------- wallet page -------------------------------
const walletPage = async (req, res) => {
    try {
        console.log("Entered wallet page");
        const userId = req.session.user;
        console.log("req.session.user", req.session.user);

        if (!userId) {
            req.flash('error', 'User not found. Please login again.');
            return res.redirect('/login');
        }

        // Check if a wallet exists for the user
        let wallet = await walletSchema.findOne({ userID: userId });
        console.log("wallet", wallet);

        // Create a new wallet for the user if it doesn't exist
        if (!wallet) {
            console.log("No wallet found, creating a new wallet for the user.");
            wallet = new walletSchema({
                userID: userId,
                balance: 0,
                transaction: []
            });
            await wallet.save();
        }

        // Send wallet data as JSON if it's for API usage
        if (req.xhr || req.headers['accept'] === 'application/json') {
            return res.json({ success: true, balance: wallet.balance });
        }
        console.log(wallet.balance,"walance.balance")

        // Render the wallet page if it's a regular page load
        res.render('user/wallet', { title: 'Wallet', wallet, user: userId });
    } catch (error) {
        console.log(`Error while rendering user wallet: ${error}`);
        req.flash('error', 'There was an error while accessing your wallet.');
        res.redirect('/userprofile');
    }
};

module.exports = { walletPage };
