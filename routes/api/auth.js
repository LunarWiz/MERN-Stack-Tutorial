const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

//@route    GET api/auth
//@desc     Test route
//@access   Public

router.get('/', auth, async (req, res) => {
    try
    {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }
    catch (e)
    {
        console.log(e.message);
        res.status(500).send(e.message);
    }
})

//@route    POST api/users
//@desc     Login route
//@access   Public

router.post('/login', [
    check('email', 'Please include a valid email')
        .isEmail(),
    check('password', 'Password is required')
        .exists()
], async (req, res) => {
    // console.log(`Input recieved: ${req.body}`);
    // console.log(req.body);

    const errors = validationResult(req);
    // console.log(errors);
    if (!errors.isEmpty())
    {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try
    {
        // See if user exists
        let user = await User.findOne({ email });

        if (!user) return res.status(400).json({ errors: [{msg: 'Invalid Credentials!'}]});

        const isMatch = bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ errors: [{msg: 'Invalid Credentials!'}]});

        // Return JSONWebToken (Immediate auth upon registration)
        const payload = {
            user:
                {
                    id: user.id
                }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 3600 * 1000 },
            (err, token) =>
            {
                if (err) throw err;
                res.json({ token });
            }

        )
    }
    catch (e)
    {
        console.error(e.message);
        res.status(500).send('Server Error');
    }




    // res.send("User Registered");
})

module.exports = router;