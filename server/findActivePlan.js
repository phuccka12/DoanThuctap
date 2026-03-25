const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const UserPlan = mongoose.model('UserPlan', new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            dayItems: Array,
            status: String
        }), 'userplans');

        const userId = "69b8e54a22945ef603dae1cd";
        const plans = await UserPlan.find({ userId }).sort({ updatedAt: -1 }).lean();

        console.log(`Found ${plans.length} plans for user ${userId}`);
        plans.forEach(p => {
            console.log(`Plan ID: ${p._id}, Status: ${p.status}, UpdatedAt: ${p.updatedAt}`);
        });

        const activePlan = plans.find(p => p.status === 'active');
        if (activePlan) {
            require('fs').writeFileSync('active_plan.json', JSON.stringify(activePlan, null, 2), 'utf8');
            console.log('Saved ACTIVE plan to active_plan.json');
        } else {
            console.log('No ACTIVE plan found for this user.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
