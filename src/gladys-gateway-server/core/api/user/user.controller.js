module.exports = function UserController(userModel, mailService, socketModel) {
  /**
   * @api {post} /users/signup Create a new user
   * @apiName Create user
   * @apiGroup User
   *
   * @apiParam {String} name Between 2 and 30 characters
   * @apiParam {String} email Email of the user
   * @apiParam {string="en","fr"} language language of the user
   * @apiParam {string} srp_salt secure remote password salt
   * @apiParam {string} srp_verifier secure remote password verifier
   * @apiParam {string} rsa_public_key RSA user publick key
   * @apiParam {string} rsa_encrypted_private_key RSA user encrypted private key
   * @apiParam {string} ecdsa_public_key ECDSA user publick key
   * @apiParam {string} ecdsa_encrypted_private_key ECDSA user encrypted private key
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 201 CREATED
   *
   * {
   *   "status": 201,
   *   "message": "User created with success. You need now to confirm your email."
   * }
   *
   */
  async function signup(req, res, next) {
    const user = await userModel.signup(req.body);

    // send confirmation email to user
    mailService.send(user, 'confirmation', {
      confirmationUrl: `${process.env.GLADYS_GATEWAY_FRONTEND_URL}/confirm-email/${encodeURI(
        user.email_confirmation_token,
      )}`,
      confirmationUrlGladys4: `${process.env.GLADYS_PLUS_FRONTEND_URL}/confirm-email/${encodeURI(
        user.email_confirmation_token,
      )}`,
    });

    res.status(201).json({
      status: 201,
      message: 'User created with success. You need now to confirm your email.',
    });
  }

  /**
   * @api {patch} /users/me Update user
   * @apiName Update user
   * @apiGroup User
   *
   * @apiParam {String} name Between 2 and 30 characters
   * @apiParam {String} email Email of the user
   * @apiParam {string="en","fr"} language language of the user
   * @apiParam {string} srp_salt secure remote password salt
   * @apiParam {string} srp_verifier secure remote password verifier
   * @apiParam {string} rsa_public_key RSA user publick key
   * @apiParam {string} rsa_encrypted_private_key RSA user encrypted private key
   * @apiParam {string} ecdsa_public_key ECDSA user publick key
   * @apiParam {string} ecdsa_encrypted_private_key ECDSA user encrypted private key
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "id": "4e7ff439-2b96-4606-adda-fd981277c39d",
   *   "name": "my name",
   *   "email": "myemail@email.com",
   *   "email_confirmed": false
   * }
   *
   */
  async function updateUser(req, res, next) {
    const user = await userModel.updateUser(req.user, req.body);

    if (user.email_confirmed === false) {
      // send confirmation email to user
      mailService.send(user, 'confirmation', {
        confirmationUrl: `${process.env.GLADYS_GATEWAY_FRONTEND_URL}/confirm-email/${user.email_confirmation_token}`,
        confirmationUrlGladys4: `${process.env.GLADYS_PLUS_FRONTEND_URL}/confirm-email/${user.email_confirmation_token}`,
      });
    }

    res.json(user);
  }

  /**
   * @api {post} /users/verify Verify user email
   * @apiName Verify user email
   * @apiGroup User
   *
   * @apiParam {String} email_confirmation_token Token sent by email to the user
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "id": "14baf452-302e-442c-aa55-d00558c3d9fe",
   *   "email_confirmed": true
   * }
   *
   */
  async function confirmEmail(req, res, next) {
    const user = await userModel.confirmEmail(req.body.email_confirmation_token);
    res.json(user);
  }

  /**
   * @api {post} /users/login-salt Login get salt
   * @apiName Login get salt
   * @apiGroup User
   *
   * @apiParam {String} email email of the user
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "srp_salt": "e0812f8c57be08780bafcc7e2cbacd155b6f63962114c12cc12462a7aa669fdb"
   * }
   *
   */
  async function loginGetSalt(req, res, next) {
    const user = await userModel.loginGetSalt(req.body);
    res.json(user);
  }

  /**
   * @api {post} /users/login-generate-ephemeral Login generate ephemeral
   * @apiName Login generate ephemeral
   * @apiGroup User
   *
   * @apiParam {String} email email of the user
   * @apiParam {String} client_ephemeral_public The client ephemeral public generate by the client
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "server_ephemeral_public": "14c12cc12462a7aa14c12cc12462a7aacbacd155b6f639621669fdb",
   *   "login_session_key": "2b405216-acc0-4508-b563-c052819dd38b"
   * }
   *
   */
  async function loginGenerateEphemeralValuePair(req, res, next) {
    res.json(await userModel.loginGenerateEphemeralValuePair(req.body));
  }

  /**
   * @api {post} /users/login-finalize Login finalize
   * @apiName Login finalize
   * @apiGroup User
   *
   * @apiParam {String} login_session_key The login session key provided previously
   * @apiParam {String} client_session_proof The proof generated by the client
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "server_session_proof": "12462a7aa14c12cc12462a7aacbacd155b6f63962112462a7aa14c12cc12462a7aacbacd155b6f639621",
   *   "two_factor_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX"
   * }
   *
   */
  async function loginDeriveSession(req, res, next) {
    res.json(await userModel.loginDeriveSession(req.body));
  }

  /**
   * @api {post} /users/two-factor-configure Configure two factor
   * @apiName Configure two factor
   * @apiGroup User
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "otpauth_url": "otpauth://totp/SecretKey?secret=F5NCGUKXFZCEA6BUIBLWSZZBME7FMUR4GFJSS4SUIYUUY62WOQ2Q"
   * }
   */
  async function configureTwoFactor(req, res, next) {
    const secret = await userModel.configureTwoFactor(req.user);
    res.json(secret);
  }

  /**
   * @api {post} /users/two-factor-enable Enable two factor
   * @apiName Enable two factor
   * @apiGroup User
   *
   * @apiParam {String} two_factor_code A code generated by the 2FA app of the client
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "two_factor_enabled": true
   * }
   */
  async function enableTwoFactor(req, res, next) {
    res.json(await userModel.enableTwoFactor(req.user, req.body.two_factor_code));
  }

  /**
   * @api {get} /users/two-factor/new Get new two factor secret
   * @apiName Get new two factor secret
   * @apiGroup User
   *
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "otpauth_url": ""
   * }
   */
  async function getNewTwoFactorSecret(req, res, next) {
    res.json(await userModel.getNewTwoFactorSecret(req.user));
  }

  /**
   * @api {patch} /users/two-factor Update two factor
   * @apiName Update two factor
   * @apiGroup User
   *
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "two_factor_enabled": true
   * }
   */
  async function updateTwoFactor(req, res, next) {
    res.json(await userModel.updateTwoFactor(req.user, req.body.two_factor_secret, req.body.two_factor_code));
  }

  /**
   * @api {post} /users/login-two-factor Login two factor
   * @apiName Login two factor
   * @apiGroup User
   *
   * @apiParam {String} two_factor_code A code generated by the 2FA app of the client
   * @apiParam {String} device_name The name of the device that will be displayed in the UI of logged device
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "access_token": "xxxx",
   *   "refresh_token": "xxxx",
   *   "device_id": "b82ef923-d849-4b98-9dee-0a6e0005903d"
   * }
   */
  async function loginTwoFactor(req, res, next) {
    const tokens = await userModel.loginTwoFactor(
      req.user,
      req.body.two_factor_code,
      req.body.device_name,
      req.headers['user-agent'],
    );
    res.json(tokens);
  }

  /**
   * @api {get} /users/access-token Get access token
   * @apiName Get access token
   * @apiGroup User
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "access_token": "xxxxxxx"
   * }
   */
  async function getAccessToken(req, res, next) {
    const token = await userModel.getAccessToken(req.user, req.headers.authorization);
    res.json(token);
  }

  /**
   * @api {post} /users/forgot-password Forgot password
   * @apiName Forgot password
   * @apiGroup User
   *
   * @apiParam {String} email Email of the user
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "success": true
   * }
   */
  async function forgotPassword(req, res, next) {
    await userModel.forgotPassword(req.body.email);
    res.json({ success: true });
  }

  /**
   * @api {post} /users/reset-password Reset password
   * @apiName Reset password
   * @apiGroup User
   *
   * @apiParam {String} token token sent by email
   * @apiParam {String} srp_salt new SRP salt
   * @apiParam {String} srp_verifier new SRP verifier
   * @apiParam {String} rsa_encrypted_private_key RSA encrypted private key
   * @apiParam {String} ecdsa_encrypted_private_key ECDSA encrypted private key
   * @apiParam {String} two_factor_code 2FA code
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "success": true
   * }
   */
  async function resetPassword(req, res, next) {
    const newUser = await userModel.resetPassword(req.body.token, req.body);

    // ask all instances in this account to clear their key cache
    await socketModel.askInstanceToClearKeyCache(newUser.account_id);

    res.json({ success: true });
  }

  /**
   * @api {get} /users/me Get Myself
   * @apiName Get Myself
   * @apiGroup User
   *
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "id": "30d56556-0aaa-4933-97cd-d226e6ffb11d",
   *   "name": "Tony Stark",
   *   "email": "tony.stark@gladysassistant.com",
   *   "role": "admin",
   *   "language": "en",
   *   "profile_url": "https://gravatar.com/sdkflmskd",
   *   "gladys_user_id": 1
   * }
   */
  async function getMySelf(req, res, next) {
    const currentUser = await userModel.getMySelf(req.user);
    res.json(currentUser);
  }

  /**
   * @api {get} /users/setup Get setup state
   * @apiName Get Setup state
   * @apiGroup User
   *
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "billing_setup": false,
   *   "gladys_instance_setup": false,
   *   "user_gladys_acccount_linked": false
   * }
   */
  async function getSetupState(req, res, next) {
    const state = await userModel.getSetupState(req.user);
    res.json(state);
  }

  /**
   * @api {get} /users/reset-password/:token Get reset password user
   * @apiName Get reset password user
   * @apiGroup User
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *
   * {
   *   "success": true
   * }
   */
  async function getEmailResetPassword(req, res, next) {
    const user = await userModel.getEmailResetPassword(req.params.token);
    res.json(user);
  }

  return {
    signup,
    updateUser,
    confirmEmail,
    configureTwoFactor,
    enableTwoFactor,
    loginGetSalt,
    loginGenerateEphemeralValuePair,
    loginDeriveSession,
    loginTwoFactor,
    getAccessToken,
    forgotPassword,
    resetPassword,
    getMySelf,
    getSetupState,
    getEmailResetPassword,
    getNewTwoFactorSecret,
    updateTwoFactor,
  };
};
