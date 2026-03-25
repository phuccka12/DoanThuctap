const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const GrammarLesson = mongoose.model('GrammarLesson', new mongoose.Schema({ title: String }), 'grammarlessons');
        const lesson = await GrammarLesson.findOne({ title: { $regex: 'Simple Present', $options: 'i' } }).lean();
        
        if (!lesson) {
            console.log('Grammar lesson "Simple Present" not found.');
            process.exit(0);
        }
        console.log('Found Lesson ID:', lesson._id);

        const UserPlan = mongoose.model('UserPlan', new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            dayItems: Array,
            status: String
        }), 'userplans');

        const plans = await UserPlan.find({ 
            $or: [
                { 'dayItems.itemId': lesson._id },
                { 'dayItems.tasks.itemId': lesson._id }
            ]
        }).lean();

        console.log(`Found ${plans.length} plans containing this lesson.`);
        if (plans.length > 0) {
            require('fs').writeFileSync('plan_found.json', JSON.stringify(plans[0], null, 2), 'utf8');
            console.log('Saved first matching plan to plan_found.json');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
