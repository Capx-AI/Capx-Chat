/* eslint-disable new-cap */
import express, { Request, Response } from "express";
import { validateAuth, validateJWT } from "../../middlewares/auth";

const router = express.Router();

router.post("/auth", validateAuth, async (req: Request, res: Response) => {
  const { last_name, first_name, username, email, password } = req.body;
  const supabaseClient = req.userSupabaseClient;

  // Try to sign in first
  const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData?.user) {
    // Update last_login
    if (signInError) {
      if (signInError.message === 'Invalid login credentials') {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      // Update last_login for successful sign in
      await supabaseClient
        .from('users')
        .update({ last_login: Math.floor(Date.now() / 1000) })
        .eq('user_id', signInData.user.id);
    }
    return res.status(200).json({
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
        first_name: signInData.user.user_metadata.first_name,
        last_name: signInData.user.user_metadata.last_name,
        username: signInData.user.user_metadata.username,
      },
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        token_type: signInData.session.token_type,
      },
    });
  }

  // If login failed and no signup data provided, return error
  if (!username || !first_name || !last_name) {
    return res.status(400).json({ error: "Missing required signup data" });
  }

  // Check if username exists
  const { data: existingUser } = await supabaseClient
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  if (existingUser) {
    return res.status(400).json({ error: "Username already taken" });
  }

  // Create new user
  const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp(
    {
      email: email,
      password: password,
      options: {
        data: {
          first_name,
          last_name,
          username,
        },
      }
    }
  );

  if (signUpError) {
    return res.status(400).json({ error: signUpError.message });
  }

  if (signUpData.user && signUpData.session) {
    return res.status(201).json({
      user: {
        id: signUpData.user.id,
        email: signUpData.user.email,
        first_name: signUpData.user.user_metadata.first_name,
        last_name: signUpData.user.user_metadata.last_name,
        username: signUpData.user.user_metadata.username,
      },
      session: {
        access_token: signUpData.session.access_token,
        refresh_token: signUpData.session.refresh_token,
        token_type: signUpData.session.token_type,
      },
    });
  } else {
    return res.status(400).json({ error: "Failed to create user" });
  }
});

router.get("/", validateJWT, async (req: Request, res: Response) => {
  const user = req.user;

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
    },
  });
})
export default router;
