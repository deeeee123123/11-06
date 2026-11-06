import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const gate = document.querySelector("#authGate");
const planner = document.querySelector("#plannerApp");
const message = document.querySelector("#authMessage");
const login = document.querySelector("#googleLogin");
const logout = document.querySelector("#logout");
const userLabel = document.querySelector("#userLabel");

function showError(error) {
  const messages = {
    "auth/unauthorized-domain": "此網域尚未加入 Firebase 授權網域，請在 Authentication → 設定中加入 deeeee123123.github.io。",
    "auth/popup-blocked": "登入視窗遭瀏覽器封鎖，請允許此網站開啟彈出視窗後重試。",
    "auth/popup-closed-by-user": "登入視窗已關閉，請重新點選登入。",
    "auth/operation-not-allowed": "Firebase 尚未啟用 Google 登入，請在 Authentication → 登入方式啟用 Google。",
    "auth/unauthorized-continue-uri": "目前登入網址未獲授權，請確認已將 deeeee123123.github.io 加入 Firebase Authentication 的授權網域。",
    "auth/network-request-failed": "無法連線至 Firebase，請檢查網路或瀏覽器是否封鎖驗證要求，再重試。"
  };
  message.textContent = messages[error.code] || `登入失敗（${error.code || "未知錯誤"}），請確認 Firebase 設定後重試。`;
}

try {
  if (!window.FIREBASE_CONFIG) throw new Error("尚未設定 Firebase Web App 設定值。");
  if (location.protocol !== "https:" && location.hostname !== "localhost") throw new Error("請透過 GitHub Pages HTTPS 網址開啟網站，再使用 Google 登入。");
  const app = initializeApp(window.FIREBASE_CONFIG);
  const auth = getAuth(app);
  auth.useDeviceLanguage();
  const isEmbedded = window.top !== window.self;
  logout.addEventListener("click", () => signOut(auth).catch(showError));
  getRedirectResult(auth).then(result => {
    if (result?.user) message.textContent = "登入成功，正在載入行程…";
  }).catch(error => { showError(error); login.disabled = false; });
  login.addEventListener("click", async () => {
    message.textContent = isEmbedded ? "正在前往 Google 登入…" : "正在開啟 Google 登入…";
    login.disabled = true;
    const timeout = setTimeout(() => {
      if (login.disabled) {
        login.disabled = false;
        message.textContent = "登入逾時或跳轉未完成。請用一般瀏覽器分頁開啟網站、允許彈出視窗，並確認 Firebase 授權網域後再試。";
      }
    }, 15000);
    try {
      if (isEmbedded) {
        message.textContent = "請於開啟的登入視窗完成 Google 登入，再返回此頁。";
        await signInWithPopup(auth, new GoogleAuthProvider());
      } else {
        await signInWithPopup(auth, new GoogleAuthProvider());
      }
    }
    catch (error) { clearTimeout(timeout); showError(error); login.disabled = false; }
  });
  onAuthStateChanged(auth, user => {
    window.firebaseAuthUser = user || null;
    window.dispatchEvent(new Event("firebase-user-ready"));
    gate.hidden = !!user;
    planner.hidden = !user;
    login.disabled = false;
    if (user) {
      userLabel.textContent = user.displayName || user.email || "個人空間";
      message.textContent = "";
      login.disabled = false;

    }
  }, showError);
} catch (error) {
  message.textContent = error.message;
  login.disabled = true;
}
