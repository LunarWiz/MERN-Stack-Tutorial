const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require('config');

const User = require('../../models/User');

//@route    POST api/users
//@desc     Registration route
//@access   Public

router.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please include a valid email')
        .isEmail(),
    check('password', 'Please enter a password with 6 or more characters')
        .isLength({min: 6})
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

    const { name, email, password } = req.body;

    try
    {
        // See if user exists
        let user = await User.findOne({ email });

        if (user)
        {
            // user exists
            return res.status(400).json({ errors: [{msg: 'User already exists!'}]});
        }

        // Get users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm',
        })

        user = new User({
            name, email, avatar, password
        });



        // BCrypt password
        const salt = await bcrypt.genSalt(10);

        user.password =  await bcrypt.hash(password, salt);

        await user.save();

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