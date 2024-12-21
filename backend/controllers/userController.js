import { z } from "zod";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { getAuth } from "firebase-admin/auth";
import { signupSchema } from "../utils/validation.js";
import { generateUsername } from "../utils/userUtils.js";
import { formatDatatoSend } from "../utils/authUtils.js";
import { signinSchema } from "../utils/validation.js";

export const signup = async (req, res) => {
  try {
    const { fullname, email, password } = signupSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(password, 10);
    const username = await generateUsername(email);

    const user = new User({
      personal_info: { fullname, email, password: hashedPassword, username },
    });

    const savedUser = await user.save();

    return res.status(201).json(formatDatatoSend(savedUser));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: err.errors.map((e) => e.message).join(", ") });
    }

    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }

    return res.status(500).json({ error: err.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = signinSchema.parse(req.body);

    const user = await User.findOne({ "personal_info.email": email });

    if (!user) {
      return res.status(403).json({ error: "Email not found" });
    }

    if (user.google_auth) {
      return res.status(403).json({
        error: "Account was created using Google. Try logging in with Google.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.personal_info.password
    );

    if (!passwordMatch) {
      return res.status(403).json({ error: "Incorrect password" });
    }

    return res.status(200).json(formatDatatoSend(user));
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const googleAuth = async (req, res) => {
  const { access_token } = req.body;

  try {
    const decodedUser = await getAuth().verifyIdToken(access_token);
    let { email, name, picture } = decodedUser;

    picture = picture.replace("s96-c", "s384-c");

    let user = await User.findOne({ "personal_info.email": email })
      .select(
        "personal_info.fullname personal_info.username personal_info.profile_img google_auth"
      )
      .catch((err) => {
        return res.status(500).json({ error: err.message });
      });

    if (user) {
      if (!user.google_auth) {
        return res.status(403).json({
          error:
            "This email was signed up without google. Please log in with password to access the account",
        });
      }
    } else {
      let username = await generateUsername(email);

      user = new User({
        personal_info: {
          fullname: name,
          email,
          username,
        },
        google_auth: true,
      });

      await user.save().catch((err) => {
        return res.status(500).json({ error: err.message });
      });
    }

    return res.status(200).json(formatDatatoSend(user));
  } catch (err) {
    return res.status(500).json({
      error:
        "Failed to authenticate you with google. Try with some other google account",
    });
  }
};