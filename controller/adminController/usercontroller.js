const userSchema=require('../../model/userSchema')




const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await userSchema.findByIdAndUpdate(userId, { isBlocked: true });
        res.status(200).json({ message: 'User blocked successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error blocking user' });
    }
};


const unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await userSchema.findByIdAndUpdate(userId, { isBlocked: false });
        res.status(200).json({ message: 'User unblocked successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error unblocking user' });
    }
};


module.exports={
blockUser,
 unblockUser 
}