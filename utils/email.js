const { htmlToText } = require("html-to-text");
const nodemailer = require("nodemailer");
// const pug = require("pug");

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstname = user.name.split(" ")[0];
        this.url = url;
        this.from = `Mehrad bz <${process.env.EMAIL}>`;
    }
    newTransport() {
        const emailEnv =
            process.env.NODE_ENV === "production"
                ? "PRODUCTION"
                : "DEVELOPMENT";
        // if (process.env.NODE_ENV === "production") {
        //     return nodemailer.createTransport({
        //         host: process.env.PRODUCTION_HOST,
        //         port: process.env.PRODUCTION_PORT,
        //         auth: {
        //             user: process.env.PRODUCTION_USERNAME,
        //             pass: process.env.PRODUCTION_PASSWORD,
        //         },
        //     });
        // }

        return nodemailer.createTransport({
            host: process.env[`${emailEnv}_HOST`],
            port: process.env[`${emailEnv}_PORT`],
            auth: {
                user: process.env[`${emailEnv}_USERNAME`],
                pass: process.env[`${emailEnv}_PASSWORD`],
            },
        });
    }

    async send(template, subject) {
        // TODO
        let html;
        // const html = pug.renderFile(
        //     `${__dirname}/../views/email/${template}.pug`,
        //     {
        //         firstname: this.firstname,
        //         url: this.url,
        //         subject,
        //     }
        // );

        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html),
        };
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send("welcome", "welcome to the Natours family!");
    }
    async sendPasswordReset() {
        await this.send(
            "passwordReset",
            "Your password reset token (Valid for 10 minutes)"
        );
    }
};
