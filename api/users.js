module.exports = function(app) {
    // var express = require('express'),
    var mongoose = require('mongoose'),
        router = require('express'),
        passport = require('passport'),
        request = require('request'),
        User = mongoose.model('User'),
        Login = mongoose.model('Login');

    async function login_counter(ip) {
        captcha = 0
        await Login.find({ 'ip': ip })
            .limit(3)
            .sort({ updatedAt: -1 })
            .select({ status: 1 }).then(function(data) {
                var sum = 0;
                for (var i in data) {
                    sum += data[i].status;
                }
                if (sum <= -3) {
                    captcha = 1
                }
            })
        return captcha;
    }


    async function captcha_valid(captcha) {
        var url = "https://www.google.com/recaptcha/api/siteverify";
        var response = await request.post(url, {
            form: {
                secret: "6Lfo-OIUAAAAAIv0Ew15lAwygfugQW6wEsXFYzYJ",
                response: captcha
            }
        }, function(error, response, body) {
            console.log("response", body)
            return body.success
        })
        return response;
    }

    app.post('/api/users/login', async function(req, res, next) {
        var captcha = await login_counter(req.ipInfo.ip);

        if (!req.body.email) {
            return res.status(500).json({ errors: "email can't be blank" });
        }
        if (!req.body.password) {
            return res.status(500).json({ errors: "password can't be blank" });
        }
        if (captcha == 1 && !req.body.captcha) {
            return res.status(500).json({ errors: "captcha can't be blank", captcha: 1 });
        } else {
            var valid = await captcha_valid(req.body.captcha);
            if (!valid) {
                return res.status(500).json({ errors: "captcha has expired", captcha: 1 });
            }
        }
        passport.authenticate('local', { session: false }, async function(err, user, info) {
            var login = new Login();
            login.ip = req.ipInfo.ip;

            if (user) {
                login.user = user._id;
                login.status = 1;
                login.save().then(function() {
                    var x = user.toAuthJSON()
                    return res.json({ user: x });
                }).catch(next);
            } else {
                login.status = -1;
                login.save().then(async function() {
                    captcha = await login_counter(req.ipInfo.ip)
                    info['captcha'] = captcha
                    return res.status(500).json(info);
                }).catch(next);
            }
        })(req, res, next);
    });

    app.post('/api/users', async function(req, res, next) {
        var re = /\S+@\S+\.\S+/;
        var captcha = await login_counter(req.ipInfo.ip);

        if (!req.body.name) {
            return res.status(500).json({ errors: "name " + "can't be blank" });
        }
        if (!req.body.email) {
            return res.status(500).json({ errors: "email " + "can't be blank" });
        } else if (!re.test(req.body.email)) {
            return res.status(500).json({ errors: "email " + "format is wrong" });
        }
        if (!req.body.password) {
            return res.status(500).json({ errors: "password " + "can't be blank" });
        }
        if (captcha == 1 && !req.body.captcha) {
            return res.status(500).json({ errors: "captcha can't be blank", captcha: 1 });
        } else {
            var valid = await captcha_valid(req.body.captcha);
            if (!valid) {
                return res.status(500).json({ errors: "captcha has expired", captcha: 1 });
            }
        }
        User.find({ email: req.body.email }).then(async function(user) {
            if (!user) {
                var user = new User();
                user.name = req.body.name;
                user.email = req.body.email;
                user.setPassword(req.body.password);

                user.save().then(function() {
                    var login = new Login();
                    login.ip = req.ipInfo.ip;
                    login.status = 1;
                    login.user = user._id;
                    login.save().then(function() {
                        var x = user.toAuthJSON()
                        return res.json({ user: x });
                    }).catch(next);
                }).catch(next);
            } else {
                var captcha = await login_counter(req.ipInfo.ip);
                return res.status(500).json({ errors: "email " + "already registered", captcha: captcha });
            }
        }).catch(next)
    });

    app.get('/api/refresh', async function(req, res, next) {
        var info = { errors: "something ent wrong, try again" };
        var captcha = await login_counter(req.ipInfo.ip);
        info['captcha'] = captcha
        return res.status(500).json(info);
    });
}