const Topic = require('../models/Topic');
const Question = require('../models/Question');
const WeeklyTest = require('../models/WeeklyTest');

const DEFAULT_TOPICS = [
  { name: 'Vedic Math / Simplification', category: 'Vedic Math', type: 'aptitude', icon: '🧮' },
  { name: 'Ratio & Proportion / HCF & LCM', category: 'Ratio and Proportion', type: 'aptitude', icon: '⚖️' },
  { name: 'Percentage', category: 'Percentage', type: 'aptitude', icon: '📊' },
  { name: 'Time & Work / Pipes & Cistern', category: 'Time and Work', type: 'aptitude', icon: '⏱️' },
  { name: 'Time, Speed & Distance', category: 'Speed and Distance', type: 'aptitude', icon: '🚗' },
  { name: 'Trains, Boats & Streams', category: 'Trains and Boats', type: 'aptitude', icon: '🚂' },
  { name: 'Profit & Loss', category: 'Profit and Loss', type: 'aptitude', icon: '📈' },
  { name: 'Ages', category: 'Ages', type: 'aptitude', icon: '👤' },
  { name: 'Simple Interest', category: 'Simple Interest', type: 'aptitude', icon: '💰' },
  { name: 'Compound Interest', category: 'Compound Interest', type: 'aptitude', icon: '🏦' },
  { name: 'Permutation & Combination', category: 'Permutation', type: 'aptitude', icon: '🎲' },
  { name: 'Probability', category: 'Probability', type: 'aptitude', icon: '🎯' },
  { name: 'Alphabet Test / Letter Series', category: 'Alphabet Test', type: 'reasoning', icon: '🔤' },
  { name: 'Blood Relations', category: 'Blood Relation', type: 'reasoning', icon: '👨‍👩‍👧‍👦' },
  { name: 'Coding & Decoding', category: 'Coding Decoding', type: 'reasoning', icon: '🔐' },
  { name: 'Syllogism', category: 'Syllogism', type: 'reasoning', icon: '🧠' },
  { name: 'Mathematical Operations (MOT)', category: 'MOT', type: 'reasoning', icon: '➕' },
  { name: 'Seating Arrangement / Puzzles', category: 'Seating Arrangement', type: 'reasoning', icon: '🪑' },
  { name: 'Direction Test', category: 'Direction Test', type: 'reasoning', icon: '🧭' }
];

// Seed default topics if collection is empty or update missing type/icon
const ensureDefaultTopics = async () => {
  try {
    const count = await Topic.countDocuments();
    if (count === 0) {
      await Topic.insertMany(DEFAULT_TOPICS);
      console.log('Seeded default topics into MongoDB');
    } else {
      // Backfill type and icon for existing topics if missing
      for (const def of DEFAULT_TOPICS) {
        await Topic.updateOne(
          { name: def.name, $or: [{ type: { $exists: false } }, { icon: { $exists: false } }] },
          { $set: { type: def.type, icon: def.icon } }
        );
      }
    }

    // Remove any corrupted topics with high special character density or binary junk
    await Topic.deleteMany({
      $or: [
        { name: { $regex: /[\!\@\#\$\%\^\&\*\(\)\_\+\<\>\?\:\;\'\`\~\\\/]{3,}/ } },
        { name: { $regex: /SOC/i } },
        { name: '&f' },
        { name: { $regex: /^\+/ } }
      ]
    });

    // Also auto-incorporate any valid topics found in Question or WeeklyTest collections
    const qTopics = await Question.distinct('topic');
    const wTopics = await WeeklyTest.distinct('topic');
    const existingTopics = new Set((await Topic.find().select('name')).map(t => t.name.toLowerCase()));

    const allDiscovered = [...new Set([...qTopics, ...wTopics])].filter(Boolean);
    for (const top of allDiscovered) {
      if (/[\!\@\#\$\%\^\&\*\(\)\_\+\<\>\?\:\;\'\`\~\\\/]{4,}/.test(top) || top.length < 2 || top === '&f' || /^\+/.test(top)) {
        continue;
      }
      if (!existingTopics.has(top.trim().toLowerCase())) {
        const isReasoning = /reason|relation|puzzle|coding|syllogism|direction|series/i.test(top);
        await Topic.create({
          name: top.trim(),
          category: top.trim(),
          type: isReasoning ? 'reasoning' : 'aptitude',
          icon: isReasoning ? '🧠' : '📚'
        });
        existingTopics.add(top.trim().toLowerCase());
      }
    }
  } catch (err) {
    console.error('Error ensuring default topics:', err.message);
  }
};

// GET /api/topics
exports.getAllTopics = async (req, res, next) => {
  try {
    await ensureDefaultTopics();
    const topics = await Topic.find().sort({ name: 1 });
    res.json(topics);
  } catch (error) {
    next(error);
  }
};

// POST /api/topics
exports.createTopic = async (req, res, next) => {
  try {
    let { name, category, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Topic name is required' });
    }

    name = name.trim();
    category = (category && category.trim()) ? category.trim() : name;

    const existing = await Topic.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'A topic with this name already exists', topic: existing });
    }

    const newTopic = await Topic.create({
      name,
      category,
      description: description ? description.trim() : ''
    });

    res.status(201).json(newTopic);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/topics/:id
exports.deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    res.json({ message: 'Topic deleted successfully', topic });
  } catch (error) {
    next(error);
  }
};
