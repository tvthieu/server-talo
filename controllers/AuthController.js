const jwtHelper = require("../helpers/jwt.helper");
const debug = console.log.bind(console);
var User = require('../models/user');
const { isEmail, isEmpty } = require("validator");

// Biến cục bộ trên server này sẽ lưu trữ tạm danh sách token
// Trong dự án thực tế, nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
let tokenList = {};

// Thời gian sống của token
const accessTokenLife = process.env.ACCESS_TOKEN_LIFE || "1m";
// Mã secretKey này phải được bảo mật tuyệt đối, các bạn có thể lưu vào biến môi trường hoặc file
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "access-token-secret-example-trungquandev.com-green-cat-a@";

// Thời gian sống của refreshToken
const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE || "3650d";
// Mã secretKey này phải được bảo mật tuyệt đối, các bạn có thể lưu vào biến môi trường hoặc file
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "refresh-token-secret-example-trungquandev.com-green-cat-a@";

/**
 * controller login
 * @param {*} req 
 * @param {*} res 
 */
let login = async (req, res) => {
  let { email, password } = req.body;
  debug(req.body)
  try {
    debug(`Đang giả lập hành động đăng nhập thành công với Email: ${email} và Password: ${password}`);
    // Mình sẽ comment mô tả lại một số bước khi làm thực tế cho các bạn như sau nhé:
    // - Đầu tiên Kiểm tra xem email người dùng đã tồn tại trong hệ thống hay chưa?
    // - Nếu chưa tồn tại thì reject: User not found.
    // - Nếu tồn tại user thì sẽ lấy password mà user truyền lên, băm ra và so sánh với mật khẩu của user lưu trong Database
    // - Nếu password sai thì reject: Password is incorrect.
    // - Nếu password đúng thì chúng ta bắt đầu thực hiện tạo mã JWT và gửi về cho người dùng.
    // Trong ví dụ demo này mình sẽ coi như tất cả các bước xác thực ở trên đều ok, mình chỉ xử lý phần JWT trở về sau thôi nhé:
    debug(`Thực hiện fake thông tin user...`);

    const user = await User.findOne({ 'email': email });
    if (!user) {
      //If the user isn't found in the database, return a message
      return res.status(201).json({ error: 'User is not exist'})
    }
    const validate = await user.isValidPassword(password);
    if (!validate) {
      return res.status(202).json({ error: 'sai password'})
    }
    if (user && validate) {
      const userData = {
        password: req.body.password,
        email: req.body.email,
      };
      const accessToken = await jwtHelper.generateToken(userData, accessTokenSecret, accessTokenLife);
      const refreshToken = await jwtHelper.generateToken(userData, refreshTokenSecret, refreshTokenLife);
      // Lưu lại 2 mã access & Refresh token, với key chính là cái refreshToken để đảm bảo unique và không sợ hacker sửa đổi dữ liệu truyền lên.
      // lưu ý trong dự án thực tế, nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
      // tokenList[refreshToken] = {accessToken, refreshToken};

      return res.status(200).json({ accessToken, refreshToken });
    }
  } catch (error) {
    debug(error);
    return res.status(500).json(error);
  }
}

/**
 * controller refreshToken
 * @param {*} req 
 * @param {*} res 
 */
let refreshToken = async (req, res) => {
  // User gửi mã refresh token kèm theo trong body
  const refreshTokenFromClient = req.body.refreshToken;
  // debug("tokenList: ", tokenList);

  // Nếu như tồn tại refreshToken truyền lên và nó cũng nằm trong tokenList của chúng ta
  //   if (refreshTokenFromClient && (tokenList[refreshTokenFromClient])) {
  if (refreshTokenFromClient) {
    try {
      // Verify kiểm tra tính hợp lệ của cái refreshToken và lấy dữ liệu giải mã decoded 
      const decoded = await jwtHelper.verifyToken(refreshTokenFromClient, refreshTokenSecret);
      // Thông tin user lúc này các bạn có thể lấy thông qua biến decoded.data
      // có thể mở comment dòng debug bên dưới để xem là rõ nhé.
      // debug("decoded: ", decoded);
      const userFakeData = decoded.data;
      const accessToken = await jwtHelper.generateToken(userFakeData, accessTokenSecret, accessTokenLife);
      // gửi token mới về cho người dùng
      return res.status(200).json({ accessToken });
    } catch (error) {
      // Lưu ý trong dự án thực tế hãy bỏ dòng debug bên dưới, mình để đây để debug lỗi cho các bạn xem thôi
      debug(error);
      res.status(403).json({
        message: 'Invalid refresh token.',
      });
    }
  } else {
    // Không tìm thấy token trong request
    return res.status(403).send({
      message: 'No token provided.',
    });
  }
};

let register = async (req, res) => {
  let { fullName, email, password } = req.body;
  debug(req.body)
  if (
    isEmpty(fullName) ||
    !isEmail(email) ||
    isEmpty(password)
  ) {
    return res.status(400).json({
      result: "failed",
      data: {},
      message: `wrong data`
    });
  }
  try {
    let newUser = new User(req.body);
    let result = await newUser.save();
    console.log(result);
    return res.status(200).json({ message: "Dang ky thanh cong" });
  } catch (error) {
    console.log(error)
    if(error.code === 11000) return res.status(301).send({message: 'Email already exists'})
    return res.status(500).json(error);
  }
}
let checkLogin = async (req, res) => {
  const accessToken = req.body.token || req.query.token || req.headers["x-access-token"];
  if (accessToken) {
    let userData = {};
    try {
      var decoded = await jwtHelper.verifyToken(accessToken, accessTokenSecret);
      userData = decoded.data;
      return res.status(200).json({ message: "logged in", accessToken: accessToken });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const newAccessToken = await jwtHelper.generateToken(userData, accessTokenSecret, accessTokenLife);
        return res.status(200).json({ message: "logged in", accessToken: newAccessToken });
      }
      return res.status(500).json(error);
    }
  } else {
    res.status(400).json({ message: "not logged in" })
  }
}

module.exports = {
  login: login,
  register: register,
  refreshToken: refreshToken,
  checkLogin: checkLogin,
}