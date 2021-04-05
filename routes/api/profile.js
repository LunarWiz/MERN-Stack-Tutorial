const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const request = require('request');
const config = require('config');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

const { check, validationResult } = require('express-validator');

//@route    GET api/profile/me
//@desc     Get current users profile
//@access   Private

router.get('/me', auth, async (req, res) => {
    try
    {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if (!profile)
        {
            return res.status(400).json({msg: 'There is no profile for the user'});
        }
    }
    catch (e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})

//@route    POST api/profile
//@desc     Create/update user profile
//@access   Private

router.post('/', [auth,
[   check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills are required').not().isEmpty()
]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ errors: errors.array() });
    }

    const
        {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        }
    = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // console.log(profileFields.skills);

    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    // res.send('Hello');
    try
    {
        let profile = await Profile.findOne({ user: req.user.id });
        console.log(profile);

        if (profile)
        {
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        // console.log(profile);

        await profile.save();

        res.json(profile);
    }
    catch (e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})

//@route    GET api/profile
//@desc     Get all profiles
//@access   Public
router.get('/', async (req, res) =>
{
    try
    {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    }
    catch(e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})

//@route    GET api/profile/user/:user_id
//@desc     Get all profiles
//@access   Public
router.get('/user/:user_id', async (req, res) =>
{
    try
    {
        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user',['name','avatar']);

        if (!profile)
        {
            return res.status(400).json({msg: 'Profile not found'});
        }

        res.json(profile);
    }
    catch(e)
    {
        console.error(e.message);
        if (e.kind == 'ObjectId') return res.status(400).json({msg: 'Profile not found'});

        res.status(500).send('Server Error');
    }
})

//@route    DELETE api/profile
//@desc     DELETE user profiles
//@access   Private
router.delete('/', auth, async (req, res) =>
{
    //@todo - remove like the posts or something lmao
    try
    {
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User deleted' });
    }
    catch(e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})

//@route    PUT api/profile/experience
//@desc     Add experience
//@access   Private
router.put('/experience', [auth,
[
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From Date is required').not().isEmpty(),
]
], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try
    {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    }
    catch (e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }

})

//@route    DELETE api/profile/experience/:exp_id
//@desc     Delete experience
//@access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try
    {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get which entry to remove (The index)
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
        // console.log(removeIndex);

        if (removeIndex === -1)
        {
            return res.status(400).json({ error: "Entry not found"});
        }

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    }
    catch (e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})

//@route    PUT api/profile/education
//@desc     Add education
//@access   Private
router.put('/education', [auth,
    [
        check('school', 'School is required').not().isEmpty(),
        check('degree', 'Degree is required').not().isEmpty(),
        check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
        check('from', 'From Date is required').not().isEmpty(),
    ]
], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try
    {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newExp);
        await profile.save();
        res.json(profile);
    }
    catch (e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }

})

//@route    DELETE api/profile/education/:exp_id
//@desc     Delete education
//@access   Private
router.delete('/education/:exp_id', auth, async (req, res) => {
    try
    {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get which entry to remove (The index)
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.exp_id);

        if (removeIndex === -1)
        {
            return res.status(400).json({ error: "Entry not found"});
        }

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    }
    catch (e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})

//@route    GET api/profile/github/:username
//@desc     Get user repos from github
//@access   Public
router.get('/github/:username',  (req, res) => {
    try
    {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}
            &client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node-js' }
        };

        request(options, (error, response, body) => {
            if (error) console.error(error);
            if (response.statusCode !== 200)
            {
                res.status(404).json({ msg: 'No Github profile found!' });
            }

            res.json(JSON.parse(body));
        })
    }
    catch (e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})


module.exports = router;