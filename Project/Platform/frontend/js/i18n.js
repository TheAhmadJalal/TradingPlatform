(function () {
  "use strict";

  var STORAGE_KEY = "lang";
  var DEFAULT_LANG = "en";
  var SUPPORTED = ["en", "fr"];

  // ───────────────────────────────────────────────────────────────────
  //  TRANSLATIONS
  // ───────────────────────────────────────────────────────────────────
  var STRINGS = {
    en: {
      // ── page titles ────────────────────────────────────────────────
      "title.home": "Cedar Capital Group",
      "title.dashboard": "Cedar Capital Group - Dashboard",
      "title.trading": "Trading Panel",
      "title.profile": "Profile - Cedar Capital Group",
      "title.reset": "Reset Password",
      "title.about": "About Us",
      "title.faq": "FAQ",
      "title.terms": "Terms of Use",
      "title.testimonials": "Testimonials",
      "title.inscription": "Sign up",
      "title.thanks": "Thank you",
      "nav.signup": "SIGN UP",

      // ── landing page nav ───────────────────────────────────────────
      "nav.features": "FEATURES",
      "nav.platform": "PLATFORM",
      "nav.accounts": "ACCOUNTS",
      "nav.how": "HOW IT WORKS",
      "nav.testimonials": "TESTIMONIALS",
      "nav.language": "Language",
      "nav.home": "HOME",
      "nav.about": "ABOUT",
      "nav.faq": "FAQ",
      "nav.terms": "TERMS",

      // ── call-to-action band on the static pages ────────────────────
      "cta.title": "Ready to invest with confidence?",
      "cta.text": "Open an account in a few minutes and let our algorithm work for you.",
      "cta.openAccount": "Open an account",
      "cta.backHome": "Back to home",

      // ── auth / modals ──────────────────────────────────────────────
      "auth.login": "Login",
      "auth.logIn": "Log in",
      "auth.register": "Register",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.fullName": "Full Name",
      "auth.phone": "Phone Number",
      "auth.close": "Close",
      "auth.closeModal": "Close modal",
      "auth.forgotPassword": "Forgot your password?",
      "auth.resetPassword": "Reset Password",
      "auth.noAccount": "Don’t have an account?",
      "auth.haveAccount": "Already have an account?",
      "auth.enterEmail": "Enter your email",
      "auth.sendResetLink": "Send Reset Link",

      // ── hero / ticker ──────────────────────────────────────────────
      "ticker.loading": "Loading…",
      "hero.title": "Trade More Easily, Without the Complications",
      "hero.subtitle": "Join the leading Cedar Capital Group trading platform and experience advanced tools and features.",
      "hero.getStarted": "Get Started",
      "hero.learnMore": "Learn More",

      // ── platform showcase ──────────────────────────────────────────
      "platform.title": "Experience Our Trading Platform",
      "platform.f1": "Real-time charts and analytics",
      "platform.f2": "Customizable dashboard",
      "platform.f3": "Multi-device access: Desktop, Mobile, Tablet",
      "platform.f4": "One-click trading",

      // ── trust ──────────────────────────────────────────────────────
      "trust.title": "Trusted by Professionals",
      "trust.text": "Used by leading institutions and top traders worldwide.",

      // ── pricing ────────────────────────────────────────────────────
      "pricing.title": "Simple, Transparent Pricing",
      "pricing.basic": "Basic",
      "pricing.basicPrice": "$0/month",
      "pricing.basicDesc": "Perfect for new traders",
      "pricing.pro": "Pro",
      "pricing.proPrice": "$49/month",
      "pricing.proDesc": "Advanced tools and charts",
      "pricing.ent": "Enterprise",
      "pricing.entPrice": "Custom pricing",
      "pricing.entDesc": "Tailored solutions for institutions",

      // ── how it works ───────────────────────────────────────────────
      "how.title": "How It Works",
      "how.s1Title": "Create Account",
      "how.s1Text": "Register and verify your identity in minutes.",
      "how.s2Title": "Fund Wallet",
      "how.s2Text": "Deposit using secure payment options.",
      "how.s3Title": "Start Trading",
      "how.s3Text": "Buy and sell CFDs with our easy-to-use platform.",

      // ── testimonials ───────────────────────────────────────────────
      "testi.title": "What Our Users Say",
      "testi.q1": "“I love the simplicity and speed of the platform. Best trading experience I've had!”",
      "testi.q2": "“Reliable, fast and secure. Highly recommend to any trader.”",
      "testi.seeAll": "Read all testimonials",

      // ── footer ─────────────────────────────────────────────────────
      "footer.privacy": "Privacy Policy",
      "footer.terms": "Terms of Use",
      "footer.support": "Support",
      "footer.about": "About Us",
      "footer.faq": "FAQ",
      "footer.testimonials": "Testimonials",
      "footer.legal": "&copy; 2025 Cedar Capital Group. All rights reserved.",

      // ── shared ─────────────────────────────────────────────────────
      "common.ok": "OK",
      "common.yes": "Yes",
      "common.no": "No",
      "common.areYouSure": "Are you sure?",
      "common.backToTop": "Back to Top",
      "common.menu": "Menu",

      // ── sidebar / mobile nav ───────────────────────────────────────
      "side.dashboard": "Dashboard",
      "side.trading": "Trading",
      "side.trade": "Trade",
      "side.profile": "Profile",
      "side.logout": "Logout",

      // ── dashboard ──────────────────────────────────────────────────
      "dash.welcomeGeneric": "Welcome back, Trader",
      "dash.welcomeUser": "Welcome, {name}",
      "dash.accountNumber": "Account Number:",
      "dash.accountStatus": "Account Status:",
      "dash.accountType": "Account Type:",
      "dash.statusActive": "Active",
      "dash.statusInactive": "Inactive",
      "dash.depositFunds": "Deposit Funds",
      "dash.withdrawFunds": "Withdraw Funds",
      "dash.txHistory": "Transaction History",
      "dash.balance": "Account Balance",
      "dash.equity": "Equity",
      "dash.usedMargin": "Used Margin",
      "dash.freeMargin": "Free Margin",
      "dash.pnl": "P&L",
      "alert.notLoggedIn": "⚠️ You are not logged in or user data is missing.",
      "alert.dashboardFailed": "❌ Could not load dashboard. Redirecting to login.",

      // ── deposit modal ──────────────────────────────────────────────
      "dep.title": "Deposit Funds",
      "dep.chooseCoin": "Choose Coin",
      "dep.generateTitle": "Generate a Deposit Address",
      "dep.generateBtn": "Generate Address",
      "dep.sendTo": "Send Funds To:",
      "dep.copyOrScan": "Copy Address or Scan QR CODE",
      "dep.verifyTitle": "Verify Your Deposit",
      "dep.txHash": "Transaction Hash",
      "dep.txHashPlaceholder": "e.g. 0xabc123…",
      "dep.verifyBtn": "Verify Deposit",
      "dep.addressLabel": "Address: {addr}",
      "dep.enterHash": "Enter a transaction hash.",
      "dep.verified": "✅ Deposit verified! ${amount} credited.",

      // ── withdraw modal ─────────────────────────────────────────────
      "wdr.title": "Withdraw",
      "wdr.checkBalance": "Check Available Balance",
      "wdr.availableDash": "Available: --",
      "wdr.available": "Available: ${amount}",
      "wdr.selectCoin": "Select Coin",
      "wdr.enterAmount": "Enter Withdrawal Amount (USD)",
      "wdr.conversionSummary": "Conversion Summary",
      "wdr.commissionDash": "Commission 4%: --",
      "wdr.totalAfterDash": "Total after commission: --",
      "wdr.pricePerCoinDash": "Price per coin: --",
      "wdr.youReceiveDash": "You will receive: --",
      "wdr.enterAddress": "Enter Destination Address",
      "wdr.addressPlaceholder": "Your wallet address",
      "wdr.submitTitle": "Submit Withdrawal",
      "wdr.submitBtn": "Submit Withdrawal",
      "wdr.rate": "1 {coin} = ${price}",
      "wdr.receive": "You receive: {amount} {coin}",
      "wdr.commission": "Commission 4%: {amount} {coin} (~${usd})",
      "wdr.afterFee": "After fee: {amount} {coin} (~${usd})",
      "wdr.priceError": "Price per coin: error",
      "wdr.completeFields": "Complete all fields.",
      "wdr.exceedsBalance": "Amount exceeds balance.",
      "wdr.noRate": "Exchange rate not available.",
      "wdr.submitted": "✅ Withdrawal submitted! You will receive ${amount}.",

      // ── transactions ───────────────────────────────────────────────
      "tx.title": "Transaction History",
      "tx.loading": "Loading transactions...",
      "tx.none": "No transactions found.",
      "tx.error": "Error loading transactions.",
      "tx.type.deposit": "DEPOSIT",
      "tx.type.withdrawal": "WITHDRAWAL",
      "tx.withdrawalLine": "{label} | Requested: ${requested} | Fee: ${fee} | Net: ${net} {coin} — {date}",
      "tx.simpleLine": "{label} | ${amount} {coin} — {date}",
      "tx.status.pending": "Pending",
      "tx.status.successful": "Successful",
      "tx.status.canceled": "Canceled",
      "tx.status.failed": "Failed",
      "tx.cancelWithdrawal": "Cancel Withdrawal",
      "tx.confirmCancel": "Cancel withdrawal request ID {id}?",
      "tx.canceledOk": "✅ Withdrawal canceled and refunded.",

      // ── trading panel ──────────────────────────────────────────────
      "trade.balance": "Balance:",
      "trade.equity": "Equity:",
      "trade.used": "Used:",
      "trade.free": "Free:",
      "trade.pnl": "P&L:",
      "trade.instrument": "Instrument",
      "trade.leverage": "Leverage",
      "trade.currentPrice": "Current Price",
      "trade.size": "Size",
      "trade.stopLoss": "Stop Loss",
      "trade.takeProfit": "Take Profit",
      "trade.pricePlaceholder": "Price",
      "trade.buy": "Buy",
      "trade.sell": "Sell",
      "trade.openPositions": "Open Positions",
      "trade.history": "Trade History",
      "trade.type.buy": "buy",
      "trade.type.sell": "sell",
      "trade.cardSize": "Size: ${v}",
      "trade.cardEntry": "Entry: ${v}",
      "trade.cardCurrent": "Current: ${v}",
      "trade.cardExit": "Exit: ${v}",
      "trade.cardPnl": "P&L: {v}",
      "trade.cardTime": "Time: {v}",
      "trade.close": "Close",
      "trade.loadFailed": "❌ Something went wrong loading your account.",
      "trade.enterSize": "Enter a valid size and wait for the live price.",
      "trade.placed": "✅ Trade placed",
      "trade.failed": "❌ Trade failed: {msg}",
      "trade.closed": "✅ Trade closed",
      "trade.closeFailed": "❌ Close failed: {msg}",
      "trade.unknownError": "Unknown error",

      // ── profile ────────────────────────────────────────────────────
      "profile.title": "Profile & Settings",
      "profile.firstName": "First Name",
      "profile.lastName": "Last Name",
      "profile.email": "Email",
      "profile.phone": "Phone Number",
      "profile.country": "Country",
      "profile.phCountry": "USA",
      "profile.oldPassword": "Old Password",
      "profile.newPassword": "New Password",
      "profile.save": "Save Changes",
      "profile.verification": "Verification",
      "profile.uploadId": "Upload ID Document",
      "profile.uploadAddress": "Upload Address Proof",
      "profile.uploadAdditional": "Upload Additional Docs",
      "profile.submitDocs": "Submit Documents",
      "profile.noInfo": "No info provided",
      "profile.notLoggedIn": "You're not logged in.",
      "profile.bothPasswords": "Please fill in both old and new passwords to change your password.",
      "profile.updated": "✅ Profile updated!",
      "profile.unknownError": "Unknown error. That’s comforting.",
      "profile.updateFailed": "❌ Could not update profile. The server is probably crying.",
      "profile.mustLogin": "You must be logged in to upload documents.",
      "profile.uploadOk": "Upload Successful!",
      "profile.uploadFailed": "❌ {label} upload failed: {msg}",
      "profile.uploadError": "❌ {label} upload error: {msg}",
      "profile.docId": "ID Verification",
      "profile.docAddress": "Address Verification",
      "profile.docAdditional": "Additional Document",

      // ── reset password page ────────────────────────────────────────
      "reset.title": "Reset Your Password",
      "reset.placeholder": "Enter new password",
      "reset.submit": "Reset Password",
      "reset.backToLogin": "Return to Login",
      "reset.missing": "Missing token or password",
      "reset.success": "Password reset successful!",
      "reset.error": "Error occurred",
      "reset.network": "Network error",

      // ── register / login / reset alerts ────────────────────────────
      "alert.fillAllFields": "⚠️ Please fill in all fields.",
      "alert.invalidEmail": "❌ Please enter a valid email address.",
      "alert.invalidPhone": "❌ Please enter a valid phone number (8–15 digits).",
      "alert.shortPassword": "❌ Password must be at least 5 characters.",
      "alert.enterEmail": "Please enter your email.",
      "alert.resetSent": "Reset link sent. Go check your email. Or your spam folder, probably.",
      "alert.somethingWrong": "Something went wrong. It usually does.",
      "alert.networkError": "Network error. Are you even online?",

      // ── chatbot ────────────────────────────────────────────────────
      "chat.prompt": "👋 Hey! If you have any questions, I’m here to help.",
      "chat.title": "Support Bot",
      "chat.inputPlaceholder": "Type your message...",
      "chat.closeChat": "Close Chat",
      "chat.invalid": "🤖 Invalid option. Try again or use keywords.",
      "chat.main": "👋 Welcome to the chat help desk!<br>Please enter the number of what you want to know more about:<br><br>1) Deposit<br>2) Withdraw<br>3) Trading and trades history<br>4) Transaction History<br>5) Verification<br>6) Security<br>7) About the company",
      "chat.deposit": "💰 Deposit Help:<br><br>1) How to deposit<br>2) Why I don't see my deposit<br>3) How long does it take<br>4) Where does my deposit go<br>5) Back",
      "chat.deposit.a1": "💡 To deposit: Dashboard → Deposit → Choose coin → Send → Add TXID → Done.",
      "chat.deposit.a2": "🕵️ Check the TXID. If it's on-chain but not showing, contact support@helpdesk.com.",
      "chat.deposit.a3": "⏱️ Deposits usually take 10–60 mins, depending on the network.",
      "chat.deposit.a4": "📥 It goes into cold wallet for bigger security.",
      "chat.withdraw": "💸 Withdraw Help:<br><br>1) How to withdraw<br>2) Pending withdrawal<br>3) Canceled withdrawal<br>4) Withdrawal fees<br>5) Back",
      "chat.withdraw.a1": "💸 Dashboard → Withdraw → Choose coin → Paste address → Confirm → Wait.",
      "chat.withdraw.a2": "⏳ Could be security checks or blockchain delay for more information contact support@helpdesk.com",
      "chat.withdraw.a3": "🚫 Usually invalid info or flagged.",
      "chat.withdraw.a4": "📉 Flat 4% fee on withdrawal.",
      "chat.trading": "📈 Trading Help:<br><br>1) How to trade<br>2) See trade history<br>3) What is CFD<br>4) Back",
      "chat.trading.a1": "🧪 Deposit → Set size/leverage → Click Buy/Sell.",
      "chat.trading.a2": "📜 Dashboard → Trading tab → Scroll down.",
      "chat.trading.a3": "🌀 CFD stands for Contract for Difference, which = financial derivative.",
      "chat.transactions": "📜 Transaction Help:<br><br>1) How to view<br>2) Canceled transaction<br>3) Fees<br>4) Back",
      "chat.transactions.a1": "🔍 Dashboard → Transaction History = all your activity.",
      "chat.transactions.a2": "🚫 Security or network errors.",
      "chat.transactions.a3": "💸 Deposits: network only. Withdrawals: 4%. No hidden fees.",
      "chat.verification": "🧾 Verification Help:<br><br>1) How to verify<br>2) Student account meaning<br>3) Account types<br>4) Back",
      "chat.verification.a1": "📤 Upload ID + proof of address in Profile → Scrol down to Verification.",
      "chat.verification.a2": "🎓 Student = Minimum investment of 250 USDT. Limited access.",
      "chat.verification.a3": "🆚 Standard = basic. Premium = fancy tools and bragging rights for more info contact finance@desk.com.",
      "chat.security": "🔐 Security Help:<br><br>1) Change password<br>2) Change email<br>3) Protect my funds<br>4) Back",
      "chat.security.a1": "🔑 Profile → Change Password.",
      "chat.security.a2": "📧 Profile → Change Email.",
      "chat.security.a3": "🛡️ Funds held in secure off network vaults.",
      "chat.about": "🏢 Company Info:<br><br>1) Where are you located?<br>2) Are you regulated?<br>3) Data privacy<br>4) Back",
      "chat.about.a1": "📍 We're registered in The United Kingdon.",
      "chat.about.a2": "✅ AML/KYC compliant.",
      "chat.about.a3": "🔒 GDPR compliant. Your data is encrypted."
    },

    fr: {
      // ── titres des pages ───────────────────────────────────────────
      "title.home": "Cedar Capital Group",
      "title.dashboard": "Cedar Capital Group - Tableau de bord",
      "title.trading": "Panneau de trading",
      "title.profile": "Profil - Cedar Capital Group",
      "title.reset": "Réinitialiser le mot de passe",
      "title.about": "À propos",
      "title.faq": "FAQ",
      "title.terms": "Conditions générales d’utilisation",
      "title.testimonials": "Témoignages",
      "title.inscription": "Inscription",
      "title.thanks": "Merci",
      "nav.signup": "INSCRIPTION",

      // ── navigation ─────────────────────────────────────────────────
      "nav.features": "FONCTIONNALITÉS",
      "nav.platform": "PLATEFORME",
      "nav.accounts": "COMPTES",
      "nav.how": "COMMENT ÇA MARCHE",
      "nav.testimonials": "TÉMOIGNAGES",
      "nav.language": "Langue",
      "nav.home": "ACCUEIL",
      "nav.about": "À PROPOS",
      "nav.faq": "FAQ",
      "nav.terms": "CGU",

      // ── bandeau d’appel à l’action des pages statiques ─────────────
      "cta.title": "Prêt à investir en confiance ?",
      "cta.text": "Ouvrez un compte en quelques minutes et laissez notre algorithme travailler pour vous.",
      "cta.openAccount": "Ouvrir un compte",
      "cta.backHome": "Retour à l’accueil",

      // ── authentification ───────────────────────────────────────────
      "auth.login": "Connexion",
      "auth.logIn": "Se connecter",
      "auth.register": "S’inscrire",
      "auth.email": "E-mail",
      "auth.password": "Mot de passe",
      "auth.fullName": "Nom complet",
      "auth.phone": "Numéro de téléphone",
      "auth.close": "Fermer",
      "auth.closeModal": "Fermer la fenêtre",
      "auth.forgotPassword": "Mot de passe oublié ?",
      "auth.resetPassword": "Réinitialiser le mot de passe",
      "auth.noAccount": "Vous n’avez pas de compte ?",
      "auth.haveAccount": "Vous avez déjà un compte ?",
      "auth.enterEmail": "Saisissez votre e-mail",
      "auth.sendResetLink": "Envoyer le lien",

      // ── hero / bandeau de prix ─────────────────────────────────────
      "ticker.loading": "Chargement…",
      "hero.title": "Tradez plus facilement sans complications",
      "hero.subtitle": "Rejoignez la principale plateforme de trading de CFD et profitez d’outils et de fonctionnalités avancés.",
      "hero.getStarted": "Commencer",
      "hero.learnMore": "En savoir plus",

      // ── plateforme ─────────────────────────────────────────────────
      "platform.title": "Découvrez notre plateforme de trading",
      "platform.f1": "Graphiques et analyses en temps réel",
      "platform.f2": "Tableau de bord personnalisable",
      "platform.f3": "Accès multi-appareils : ordinateur, mobile, tablette",
      "platform.f4": "Trading en un clic",

      // ── confiance ──────────────────────────────────────────────────
      "trust.title": "La confiance des professionnels",
      "trust.text": "Utilisée par de grandes institutions et les meilleurs traders du monde entier.",

      // ── tarifs ─────────────────────────────────────────────────────
      "pricing.title": "Des tarifs simples et transparents",
      "pricing.basic": "Basique",
      "pricing.basicPrice": "0 $/mois",
      "pricing.basicDesc": "Parfait pour les nouveaux traders",
      "pricing.pro": "Pro",
      "pricing.proPrice": "49 $/mois",
      "pricing.proDesc": "Outils et graphiques avancés",
      "pricing.ent": "Entreprise",
      "pricing.entPrice": "Tarification personnalisée",
      "pricing.entDesc": "Des solutions sur mesure pour les institutions",

      // ── comment ça marche ──────────────────────────────────────────
      "how.title": "Comment ça marche",
      "how.s1Title": "Créez un compte",
      "how.s1Text": "Inscrivez-vous et vérifiez votre identité en quelques minutes.",
      "how.s2Title": "Alimentez votre portefeuille",
      "how.s2Text": "Déposez des fonds via des moyens de paiement sécurisés.",
      "how.s3Title": "Commencez à trader",
      "how.s3Text": "Achetez et vendez des CFD sur notre plateforme intuitive.",

      // ── témoignages ────────────────────────────────────────────────
      "testi.title": "Ce que disent nos utilisateurs",
      "testi.q1": "« J’adore la simplicité et la rapidité de la plateforme. La meilleure expérience de trading que j’aie connue ! »",
      "testi.q2": "« Fiable, rapide et sécurisée. Je la recommande vivement à tout trader. »",
      "testi.seeAll": "Voir tous les témoignages",

      // ── pied de page ───────────────────────────────────────────────
      "footer.privacy": "Politique de confidentialité",
      "footer.terms": "Conditions d’utilisation",
      "footer.support": "Assistance",
      "footer.about": "À propos",
      "footer.faq": "FAQ",
      "footer.testimonials": "Témoignages",
      "footer.legal": "&copy; 2025 Cedar Capital Group. Tous droits réservés.",

      // ── éléments communs ───────────────────────────────────────────
      "common.ok": "OK",
      "common.yes": "Oui",
      "common.no": "Non",
      "common.areYouSure": "Êtes-vous sûr ?",
      "common.backToTop": "Retour en haut",
      "common.menu": "Menu",

      // ── menu latéral ───────────────────────────────────────────────
      "side.dashboard": "Tableau de bord",
      "side.trading": "Trading",
      "side.trade": "Trader",
      "side.profile": "Profil",
      "side.logout": "Déconnexion",

      // ── tableau de bord ────────────────────────────────────────────
      "dash.welcomeGeneric": "Bon retour, trader",
      "dash.welcomeUser": "Bienvenue, {name}",
      "dash.accountNumber": "Numéro de compte :",
      "dash.accountStatus": "Statut du compte :",
      "dash.accountType": "Type de compte :",
      "dash.statusActive": "Actif",
      "dash.statusInactive": "Inactif",
      "dash.depositFunds": "Déposer des fonds",
      "dash.withdrawFunds": "Retirer des fonds",
      "dash.txHistory": "Historique des transactions",
      "dash.balance": "Solde du compte",
      "dash.equity": "Capital",
      "dash.usedMargin": "Marge utilisée",
      "dash.freeMargin": "Marge libre",
      "dash.pnl": "P&L",
      "alert.notLoggedIn": "⚠️ Vous n’êtes pas connecté ou vos données utilisateur sont manquantes.",
      "alert.dashboardFailed": "❌ Impossible de charger le tableau de bord. Redirection vers la connexion.",

      // ── fenêtre de dépôt ───────────────────────────────────────────
      "dep.title": "Déposer des fonds",
      "dep.chooseCoin": "Choisissez une crypto",
      "dep.generateTitle": "Générez une adresse de dépôt",
      "dep.generateBtn": "Générer l’adresse",
      "dep.sendTo": "Envoyez les fonds à :",
      "dep.copyOrScan": "Copiez l’adresse ou scannez le QR CODE",
      "dep.verifyTitle": "Vérifiez votre dépôt",
      "dep.txHash": "Hash de transaction",
      "dep.txHashPlaceholder": "ex. 0xabc123…",
      "dep.verifyBtn": "Vérifier le dépôt",
      "dep.addressLabel": "Adresse : {addr}",
      "dep.enterHash": "Saisissez un hash de transaction.",
      "dep.verified": "✅ Dépôt vérifié ! {amount} $ crédités.",

      // ── fenêtre de retrait ─────────────────────────────────────────
      "wdr.title": "Retrait",
      "wdr.checkBalance": "Vérifiez le solde disponible",
      "wdr.availableDash": "Disponible : --",
      "wdr.available": "Disponible : {amount} $",
      "wdr.selectCoin": "Sélectionnez une crypto",
      "wdr.enterAmount": "Saisissez le montant du retrait (USD)",
      "wdr.conversionSummary": "Récapitulatif de la conversion",
      "wdr.commissionDash": "Commission 4 % : --",
      "wdr.totalAfterDash": "Total après commission : --",
      "wdr.pricePerCoinDash": "Prix par unité : --",
      "wdr.youReceiveDash": "Vous recevrez : --",
      "wdr.enterAddress": "Saisissez l’adresse de destination",
      "wdr.addressPlaceholder": "Votre adresse de portefeuille",
      "wdr.submitTitle": "Soumettez le retrait",
      "wdr.submitBtn": "Soumettre le retrait",
      "wdr.rate": "1 {coin} = {price} $",
      "wdr.receive": "Vous recevez : {amount} {coin}",
      "wdr.commission": "Commission 4 % : {amount} {coin} (~{usd} $)",
      "wdr.afterFee": "Après frais : {amount} {coin} (~{usd} $)",
      "wdr.priceError": "Prix par unité : erreur",
      "wdr.completeFields": "Veuillez remplir tous les champs.",
      "wdr.exceedsBalance": "Le montant dépasse votre solde.",
      "wdr.noRate": "Taux de change indisponible.",
      "wdr.submitted": "✅ Retrait soumis ! Vous recevrez {amount} $.",

      // ── transactions ───────────────────────────────────────────────
      "tx.title": "Historique des transactions",
      "tx.loading": "Chargement des transactions…",
      "tx.none": "Aucune transaction trouvée.",
      "tx.error": "Erreur lors du chargement des transactions.",
      "tx.type.deposit": "DÉPÔT",
      "tx.type.withdrawal": "RETRAIT",
      "tx.withdrawalLine": "{label} | Demandé : {requested} $ | Frais : {fee} $ | Net : {net} $ {coin} — {date}",
      "tx.simpleLine": "{label} | {amount} $ {coin} — {date}",
      "tx.status.pending": "En attente",
      "tx.status.successful": "Réussie",
      "tx.status.canceled": "Annulée",
      "tx.status.failed": "Échouée",
      "tx.cancelWithdrawal": "Annuler le retrait",
      "tx.confirmCancel": "Annuler la demande de retrait ID {id} ?",
      "tx.canceledOk": "✅ Retrait annulé et remboursé.",

      // ── panneau de trading ─────────────────────────────────────────
      "trade.balance": "Solde :",
      "trade.equity": "Capital :",
      "trade.used": "Utilisée :",
      "trade.free": "Libre :",
      "trade.pnl": "P&L :",
      "trade.instrument": "Instrument",
      "trade.leverage": "Effet de levier",
      "trade.currentPrice": "Prix actuel",
      "trade.size": "Taille",
      "trade.stopLoss": "Stop Loss",
      "trade.takeProfit": "Take Profit",
      "trade.pricePlaceholder": "Prix",
      "trade.buy": "Acheter",
      "trade.sell": "Vendre",
      "trade.openPositions": "Positions ouvertes",
      "trade.history": "Historique des trades",
      "trade.type.buy": "achat",
      "trade.type.sell": "vente",
      "trade.cardSize": "Taille : {v} $",
      "trade.cardEntry": "Entrée : {v} $",
      "trade.cardCurrent": "Actuel : {v} $",
      "trade.cardExit": "Sortie : {v} $",
      "trade.cardPnl": "P&L : {v}",
      "trade.cardTime": "Heure : {v}",
      "trade.close": "Clôturer",
      "trade.loadFailed": "❌ Une erreur est survenue lors du chargement de votre compte.",
      "trade.enterSize": "Saisissez une taille valide et attendez le prix en direct.",
      "trade.placed": "✅ Position ouverte",
      "trade.failed": "❌ Échec de l’ordre : {msg}",
      "trade.closed": "✅ Position clôturée",
      "trade.closeFailed": "❌ Échec de la clôture : {msg}",
      "trade.unknownError": "Erreur inconnue",

      // ── profil ─────────────────────────────────────────────────────
      "profile.title": "Profil et paramètres",
      "profile.firstName": "Prénom",
      "profile.lastName": "Nom",
      "profile.email": "E-mail",
      "profile.phone": "Numéro de téléphone",
      "profile.country": "Pays",
      "profile.phCountry": "France",
      "profile.oldPassword": "Ancien mot de passe",
      "profile.newPassword": "Nouveau mot de passe",
      "profile.save": "Enregistrer les modifications",
      "profile.verification": "Vérification",
      "profile.uploadId": "Téléverser une pièce d’identité",
      "profile.uploadAddress": "Téléverser un justificatif de domicile",
      "profile.uploadAdditional": "Téléverser des documents supplémentaires",
      "profile.submitDocs": "Envoyer les documents",
      "profile.noInfo": "Aucune information fournie",
      "profile.notLoggedIn": "Vous n’êtes pas connecté.",
      "profile.bothPasswords": "Veuillez renseigner l’ancien et le nouveau mot de passe pour le modifier.",
      "profile.updated": "✅ Profil mis à jour !",
      "profile.unknownError": "Erreur inconnue. C’est rassurant.",
      "profile.updateFailed": "❌ Impossible de mettre à jour le profil. Le serveur est probablement en train de pleurer.",
      "profile.mustLogin": "Vous devez être connecté pour téléverser des documents.",
      "profile.uploadOk": "Téléversement réussi !",
      "profile.uploadFailed": "❌ Échec du téléversement de {label} : {msg}",
      "profile.uploadError": "❌ Erreur de téléversement de {label} : {msg}",
      "profile.docId": "Vérification d’identité",
      "profile.docAddress": "Justificatif de domicile",
      "profile.docAdditional": "Document supplémentaire",

      // ── réinitialisation du mot de passe ───────────────────────────
      "reset.title": "Réinitialisez votre mot de passe",
      "reset.placeholder": "Saisissez le nouveau mot de passe",
      "reset.submit": "Réinitialiser le mot de passe",
      "reset.backToLogin": "Retour à la connexion",
      "reset.missing": "Jeton ou mot de passe manquant",
      "reset.success": "Mot de passe réinitialisé avec succès !",
      "reset.error": "Une erreur est survenue",
      "reset.network": "Erreur réseau",

      // ── alertes inscription / connexion ────────────────────────────
      "alert.fillAllFields": "⚠️ Veuillez remplir tous les champs.",
      "alert.invalidEmail": "❌ Veuillez saisir une adresse e-mail valide.",
      "alert.invalidPhone": "❌ Veuillez saisir un numéro de téléphone valide (8 à 15 chiffres).",
      "alert.shortPassword": "❌ Le mot de passe doit contenir au moins 5 caractères.",
      "alert.enterEmail": "Veuillez saisir votre e-mail.",
      "alert.resetSent": "Lien de réinitialisation envoyé. Allez voir votre boîte mail. Ou vos spams, probablement.",
      "alert.somethingWrong": "Une erreur est survenue. Comme d’habitude.",
      "alert.networkError": "Erreur réseau. Êtes-vous vraiment connecté ?",

      // ── assistant de discussion ────────────────────────────────────
      "chat.prompt": "👋 Bonjour ! Si vous avez des questions, je suis là pour vous aider.",
      "chat.title": "Assistant support",
      "chat.inputPlaceholder": "Saisissez votre message…",
      "chat.closeChat": "Fermer la discussion",
      "chat.invalid": "🤖 Option invalide. Réessayez ou utilisez des mots-clés.",
      "chat.main": "👋 Bienvenue au service d’assistance !<br>Saisissez le numéro du sujet qui vous intéresse :<br><br>1) Dépôt<br>2) Retrait<br>3) Trading et historique des trades<br>4) Historique des transactions<br>5) Vérification<br>6) Sécurité<br>7) À propos de la société",
      "chat.deposit": "💰 Aide au dépôt :<br><br>1) Comment déposer<br>2) Pourquoi je ne vois pas mon dépôt<br>3) Combien de temps cela prend<br>4) Où vont mes fonds<br>5) Retour",
      "chat.deposit.a1": "💡 Pour déposer : Tableau de bord → Dépôt → Choisir la crypto → Envoyer → Ajouter le TXID → Terminé.",
      "chat.deposit.a2": "🕵️ Vérifiez le TXID. S’il est sur la blockchain mais n’apparaît pas, contactez support@helpdesk.com.",
      "chat.deposit.a3": "⏱️ Les dépôts prennent généralement 10 à 60 minutes, selon le réseau.",
      "chat.deposit.a4": "📥 Les fonds sont placés en portefeuille froid pour une sécurité renforcée.",
      "chat.withdraw": "💸 Aide au retrait :<br><br>1) Comment retirer<br>2) Retrait en attente<br>3) Retrait annulé<br>4) Frais de retrait<br>5) Retour",
      "chat.withdraw.a1": "💸 Tableau de bord → Retrait → Choisir la crypto → Coller l’adresse → Confirmer → Patienter.",
      "chat.withdraw.a2": "⏳ Cela peut venir de contrôles de sécurité ou d’un délai de la blockchain ; pour plus d’informations, contactez support@helpdesk.com",
      "chat.withdraw.a3": "🚫 Généralement des informations invalides ou un signalement.",
      "chat.withdraw.a4": "📉 Frais fixes de 4 % sur les retraits.",
      "chat.trading": "📈 Aide au trading :<br><br>1) Comment trader<br>2) Voir l’historique des trades<br>3) Qu’est-ce qu’un CFD<br>4) Retour",
      "chat.trading.a1": "🧪 Déposer → Définir la taille et l’effet de levier → Cliquer sur Acheter/Vendre.",
      "chat.trading.a2": "📜 Tableau de bord → Onglet Trading → Faire défiler vers le bas.",
      "chat.trading.a3": "🌀 CFD signifie « Contract for Difference » (contrat sur différence), soit un produit dérivé financier.",
      "chat.transactions": "📜 Aide aux transactions :<br><br>1) Comment les consulter<br>2) Transaction annulée<br>3) Frais<br>4) Retour",
      "chat.transactions.a1": "🔍 Tableau de bord → Historique des transactions = toute votre activité.",
      "chat.transactions.a2": "🚫 Erreurs de sécurité ou de réseau.",
      "chat.transactions.a3": "💸 Dépôts : frais de réseau uniquement. Retraits : 4 %. Aucun frais caché.",
      "chat.verification": "🧾 Aide à la vérification :<br><br>1) Comment se faire vérifier<br>2) Signification du compte Étudiant<br>3) Types de comptes<br>4) Retour",
      "chat.verification.a1": "📤 Téléversez votre pièce d’identité et un justificatif de domicile dans Profil → Faites défiler jusqu’à Vérification.",
      "chat.verification.a2": "🎓 Étudiant = investissement minimum de 250 USDT. Accès limité.",
      "chat.verification.a3": "🆚 Standard = basique. Premium = outils sophistiqués et prestige ; pour plus d’informations, contactez finance@desk.com.",
      "chat.security": "🔐 Aide à la sécurité :<br><br>1) Changer le mot de passe<br>2) Changer l’e-mail<br>3) Protéger mes fonds<br>4) Retour",
      "chat.security.a1": "🔑 Profil → Changer le mot de passe.",
      "chat.security.a2": "📧 Profil → Changer l’e-mail.",
      "chat.security.a3": "🛡️ Les fonds sont conservés dans des coffres sécurisés hors réseau.",
      "chat.about": "🏢 Informations sur la société :<br><br>1) Où êtes-vous situés ?<br>2) Êtes-vous réglementés ?<br>3) Confidentialité des données<br>4) Retour",
      "chat.about.a1": "📍 Nous sommes enregistrés au Royaume-Uni.",
      "chat.about.a2": "✅ Conforme aux exigences AML/KYC.",
      "chat.about.a3": "🔒 Conforme au RGPD. Vos données sont chiffrées."
    }
  };

  // ───────────────────────────────────────────────────────────────────
  //  ENGINE
  // ───────────────────────────────────────────────────────────────────
  var currentLang = readStoredLang();
  var listeners = [];

  function readStoredLang() {
    // ?lang=fr in the URL wins, so a page can be linked in a given language.
    var fromUrl = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get("lang");
    } catch (err) {
      fromUrl = null;
    }
    if (SUPPORTED.indexOf(fromUrl) !== -1) {
      try {
        localStorage.setItem(STORAGE_KEY, fromUrl);
      } catch (err) {
        /* storage unavailable — language just won't persist */
      }
      return fromUrl;
    }

    var stored;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      stored = null; // private mode / storage disabled
    }
    return SUPPORTED.indexOf(stored) !== -1 ? stored : DEFAULT_LANG;
  }

  function getLang() {
    return currentLang;
  }

  /**
   * Look up a key and fill in {placeholders}.
   * Falls back to English, then to the key itself (so a missing key is
   * visible instead of blanking the UI).
   */
  function tr(key, vars) {
    var table = STRINGS[currentLang] || STRINGS[DEFAULT_LANG];
    var text = table[key];
    if (text == null) text = STRINGS[DEFAULT_LANG][key];
    if (text == null) return key;
    if (!vars) return text;

    return text.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match;
    });
  }

  /** Swap every translatable node under `root` into the current language. */
  function applyI18n(root) {
    var scope = root || document;

    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = tr(el.getAttribute("data-i18n"));
    });

    scope.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = tr(el.getAttribute("data-i18n-html"));
    });

    scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", tr(el.getAttribute("data-i18n-placeholder")));
    });

    scope.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", tr(el.getAttribute("data-i18n-title")));
    });

    scope.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      el.setAttribute("aria-label", tr(el.getAttribute("data-i18n-aria-label")));
    });

    document.documentElement.setAttribute("lang", currentLang);
    syncToggle();
    listeners.forEach(function (fn) {
      try {
        fn(currentLang);
      } catch (err) {
        console.error("onLangChange listener failed:", err);
      }
    });
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1 || lang === currentLang) return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* storage unavailable — language just won't persist */
    }
    applyI18n();
  }

  /** Register a callback that re-renders JS-generated text after a switch. */
  function onLangChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  /**
   * Merge extra strings into a language table. Used by js/i18n-pages.js so the
   * long copy of the About / FAQ / Terms / Testimonials pages is only loaded by
   * the pages that actually need it.
   *   addStrings("fr", { "about.title": "À propos", … })
   */
  function addStrings(lang, table) {
    if (!STRINGS[lang]) STRINGS[lang] = {};
    Object.keys(table).forEach(function (key) {
      STRINGS[lang][key] = table[key];
    });
    // If the page has already been translated, refresh it with the new strings.
    if (document.readyState !== "loading") applyI18n();
  }

  // ───────────────────────────────────────────────────────────────────
  //  EN / FR SWITCH
  // ───────────────────────────────────────────────────────────────────
  var TOGGLE_CSS =
    ".lang-toggle{display:inline-flex;align-items:center;border:1px solid rgba(0,240,255,.45);" +
    "border-radius:999px;overflow:hidden;background:rgba(0,240,255,.07);vertical-align:middle;" +
    "flex:0 0 auto;font-family:inherit}" +
    ".lang-toggle .lang-btn{appearance:none;-webkit-appearance:none;border:0;background:transparent;" +
    "color:#e8fdff;font:inherit;font-size:.72rem;font-weight:700;letter-spacing:.06em;" +
    "padding:.35rem .68rem;margin:0;cursor:pointer;line-height:1;min-width:2.4rem;" +
    "transition:background .18s ease,color .18s ease}" +
    ".lang-toggle .lang-btn:hover{background:rgba(0,240,255,.18)}" +
    ".lang-toggle .lang-btn.active{background:#00f0ff;color:#04121a}" +
    ".lang-toggle .lang-btn:focus-visible{outline:2px solid #00f0ff;outline-offset:2px}" +
    ".lang-toggle-floating{position:fixed;top:12px;right:14px;z-index:10000}";

  function injectCss() {
    if (document.getElementById("i18n-toggle-css")) return;
    var style = document.createElement("style");
    style.id = "i18n-toggle-css";
    style.textContent = TOGGLE_CSS;
    document.head.appendChild(style);
  }

  function buildToggle() {
    if (document.getElementById("langToggle")) return;
    injectCss();

    var wrap = document.createElement("div");
    wrap.className = "lang-toggle";
    wrap.id = "langToggle";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", tr("nav.language"));

    SUPPORTED.forEach(function (lang) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-btn";
      btn.dataset.lang = lang;
      btn.textContent = lang.toUpperCase();
      btn.addEventListener("click", function () {
        setLang(lang);
      });
      wrap.appendChild(btn);
    });

    var mount = document.getElementById("langToggleMount");
    if (mount) {
      mount.appendChild(wrap);
    } else {
      wrap.classList.add("lang-toggle-floating");
      document.body.appendChild(wrap);
    }
    syncToggle();
  }

  function syncToggle() {
    var wrap = document.getElementById("langToggle");
    if (!wrap) return;
    wrap.setAttribute("aria-label", tr("nav.language"));
    wrap.querySelectorAll(".lang-btn").forEach(function (btn) {
      var active = btn.dataset.lang === currentLang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  // ───────────────────────────────────────────────────────────────────
  //  BOOT
  // ───────────────────────────────────────────────────────────────────
  function boot() {
    buildToggle();
    applyI18n();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Public API (named `tr` on purpose — `t` is already used as a loop
  // variable in trading.js and would be shadowed there).
  window.tr = tr;
  window.setLang = setLang;
  window.getLang = getLang;
  window.applyI18n = applyI18n;
  window.onLangChange = onLangChange;
  window.addStrings = addStrings;
})();
