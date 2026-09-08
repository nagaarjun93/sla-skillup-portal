const Topic = require('../models/Topic');
const Question = require('../models/Question');
const WeeklyTest = require('../models/WeeklyTest');

const DEFAULT_TOPICS = [
  { name: 'Vedic Math / Simplification', category: 'Vedic Math' },
  { name: 'Ratio & Proportion / HCF & LCM', category: 'Ratio and Proportion' },
  { name: 'Percentage', category: 'Percentage' },
  { name: 'Time & Work / Pipes & Cistern', category: 'Time and Work' },
  { name: 'Time, Speed & Distance', category: 'Speed and Distance' },
  { name: 'Trains, Boats & Streams', category: 'Trains and Boats' },
  { name: 'Profit & Loss', category: 'Profit and Loss' },
  { name: 'Ages', category: 'Ages' },
  { name: 'Simple Interest', category: 'Simple Interest' },
  { name: 'Compound Interest', category: 'Compound Interest' },
  { name: 'Permutation & Combination', category: 'Permutation' },
  { name: 'Probability', category: 'Probability' },
  { name: 'Alphabet Test / Letter Series', category: 'Alphabet Test' },
  { name: 'Blood Relations', category: 'Blood Relation' },
  { name: 'Coding & Decoding', category: 'Coding Decoding' },
  { name: 'Syllogism', category: 'Syllogism' },
  { name: 'Mathematical Operations (MOT)', category: 'MOT' },
  { name: 'Seating Arrangement / Puzzles', category: 'Seating Arrangement' },
  { name: 'Direction Test', category: 'Direction Test' }
];

// Seed default topics if collection is empty
const ensureDefaultTopics = async () => {
  try {
    const count = await Topic.countDocuments();
    if (count === 0) {
      await Topic.insertMany(DEFAULT_TOPICS);
      console.log('Seeded default topics into MongoDB');
    }

    // Also auto-incorporate any topics found in Question or WeeklyTest collections
    const qTopics = await Question.distinct('topic');
    const wTopics = await WeeklyTest.distinct('topic');
    const existingTopics = new Set((await Topic.find().select('name')).map(t => t.name.toLowerCase()));

    const allDiscovered = [...new Set([...qTopics, ...wTopics])].filter(Boolean);
    for (const top of allDiscovered) {
      if (!existingTopics.has(top.trim().toLowerCase())) {
        await Topic.create({
          name: top.trim(),
          category: top.trim()
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
