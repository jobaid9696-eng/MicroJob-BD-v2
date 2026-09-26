// MicroJob BD v2 FINAL Logic
const db = {
    get: (key, def) => JSON.parse(localStorage.getItem(key)) || def,
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

const auth = {
    init: () => {
        const user = db.get('currentUser', null);
        if(user) {
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            ui.showTab('tasks');
            ui.updateUserBar();
        } else {
            document.getElementById('auth-screen').style.display = 'flex';
            document.getElementById('main-content').style.display = 'none';
            auth.switchAuthView('login');
        }
    },
    switchAuthView: (view) => {
        const loginCard = document.getElementById('login-card');
        const regCard = document.getElementById('register-card');
        if(view === 'register') {
            if(loginCard) loginCard.style.display = 'none';
            if(regCard) regCard.style.display = 'block';
        } else {
            if(loginCard) loginCard.style.display = 'block';
            if(regCard) regCard.style.display = 'none';
        }
    },
    login: () => {
        const u = (document.getElementById('login-username')?.value || '').trim();
        const p = (document.getElementById('login-password')?.value || '').trim();
        if(!u || !p) { alert('Please enter both username and password.'); return; }
        
        let users = db.get('users', []);
        let found = users.find(x => x.username.toLowerCase() === u.toLowerCase() && x.pass === p);
        
        if(!found) {
            alert('Invalid username or password! Please register an account if you have not registered yet.');
            return;
        }
        db.set('currentUser', found);
        auth.init();
    },
    register: () => {
        const name = (document.getElementById('reg-name')?.value || '').trim();
        const email = (document.getElementById('reg-email')?.value || '').trim();
        const u = (document.getElementById('reg-username')?.value || '').trim();
        const p = (document.getElementById('reg-password')?.value || '').trim();
        const ref = (document.getElementById('reg-ref')?.value || '').trim();

        if(!name || !email || !u || !p) {
            alert('Please fill out all required fields (Full Name, Gmail, Username, Password).');
            return;
        }

        if(!email.includes('@')) {
            alert('Please enter a valid Gmail / email address.');
            return;
        }

        let users = db.get('users', []);
        let existing = users.find(x => x.username.toLowerCase() === u.toLowerCase());
        if(existing) {
            alert('Username is already taken! Please choose a different username.');
            return;
        }

        const newUser = {
            name,
            email,
            username: u,
            pass: p,
            balance: 0.0,
            ref: 'MJ' + Math.floor(1000 + Math.random() * 9000),
            referredBy: ref || null
        };

        users.push(newUser);
        db.set('users', users);

        alert('Registration successful! Please login with your new account.');
        
        const loginUserField = document.getElementById('login-username');
        if(loginUserField) loginUserField.value = u;
        
        auth.switchAuthView('login');
    },
    logout: () => {
        localStorage.removeItem('currentUser');
        auth.init();
    }
};

const ui = {
    updateUserBar: () => {
        const user = db.get('currentUser', {});
        const bar = document.getElementById('user-bar');
        if(bar) bar.innerHTML = `<span>👤 ${user.username}</span><span>💰 $${(user.balance || 0).toFixed(2)}</span>`;
    },
    showTab: (tab) => {
        const container = document.getElementById('view-container');
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        
        // highlight active nav
        const btn = document.getElementById('nav-' + tab);
        if(btn) btn.classList.add('active');

        if(tab === 'tasks') {
            const jobsList = db.get('jobs', []);
            let html = `<h2>Available Tasks</h2><p class="subtitle">Complete tasks to earn USDT</p>`;
            if(jobsList.length === 0) {
                html += `<div class="card text-center"><p>No tasks available right now.</p><p class="text-muted">Post a job or check back later!</p></div>`;
            } else {
                html += jobsList.map((j, i) => `
                    <div class="card job-card">
                        <h3>${j.title}</h3>
                        <p>${j.desc}</p>
                        <div class="job-meta"><span>Reward: <b>$${j.reward}</b></span><span>By: ${j.poster}</span></div>
                        <button class="btn-sm" onclick="jobs.complete(${i})">Complete Task</button>
                    </div>
                `).join('');
            }
            container.innerHTML = html;
        } 
        else if(tab === 'post') {
            container.innerHTML = `
                <h2>Post New Job</h2>
                <div class="card">
                    <div class="form-group">
                        <label>Job Title</label>
                        <input id="job-title" placeholder="e.g. Subscribe Channel">
                    </div>
                    <div class="form-group">
                        <label>Instructions / Description</label>
                        <textarea id="job-desc" placeholder="e.g. Join t.me/... and send screenshot" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Reward in USDT</label>
                        <input type="number" id="job-reward" placeholder="e.g. 0.10" step="0.01">
                    </div>
                    <button onclick="jobs.add()">Post Job ($)</button>
                </div>
            `;
        } 
        else if(tab === 'wallet') {
            const user = db.get('currentUser', {});
            container.innerHTML = `
                <h2>My Wallet</h2>
                <div class="card text-center">
                    <p class="text-muted">Total Balance</p>
                    <h1 class="balance-title">$${(user.balance || 0).toFixed(2)} <span class="currency">USDT</span></h1>
                    <div class="wallet-btns">
                        <button onclick="wallet.depositModal()">Deposit</button>
                        <button class="btn-secondary" onclick="wallet.withdrawModal()">Withdraw</button>
                    </div>
                </div>
                <div class="card">
                    <h3>BEP20 USDT Deposit Address</h3>
                    <code class="crypto-address">0x71C83952B9c828d15A...</code>
                    <p class="text-muted small">Min deposit: $5 - Max: $100</p>
                </div>
            `;
        }
        else if(tab === 'ref') {
            const user = db.get('currentUser', {});
            container.innerHTML = `
                <h2>Referral Program</h2>
                <div class="card text-center">
                    <p style="margin-bottom: 12px;">Invite friends and earn 5% of their task earnings!</p>
                    <input type="text" readonly value="https://microjobbd.app/ref/${user.ref || 'MJ123'}" style="text-align: center; margin-bottom: 12px; font-weight: bold;">
                    <button onclick="alert('Referral link copied!')">Copy Link</button>
                </div>
            `;
        }
        else if(tab === 'contact') {
            container.innerHTML = `
                <h2>Contact Admin</h2>
                <div class="card text-center">
                    <p>Need help or deposit approval?</p>
                    <p style="margin-top: 8px;">Reach out directly to our admin on Telegram:</p>
                    <a href="https://t.me/jobaid2296" target="_blank" class="telegram-btn">💬 @jobaid2296</a>
                </div>
            `;
        }
        ui.updateUserBar();
    }
};

const jobs = {
    add: () => {
        const title = document.getElementById('job-title').value.trim();
        const desc = document.getElementById('job-desc').value.trim();
        const reward = parseFloat(document.getElementById('job-reward').value);
        const user = db.get('currentUser', {});

        if(!title || !desc || !reward) {
            alert('Please fill out all job fields.');
            return;
        }

        let jobsList = db.get('jobs', []);
        jobsList.unshift({ title, desc, reward, poster: user.username });
        db.set('jobs', jobsList);
        
        alert('Job Posted Successfully!');
        ui.showTab('tasks');
    },
    complete: (index) => {
        let jobsList = db.get('jobs', []);
        const job = jobsList[index];
        let user = db.get('currentUser', {});
        
        user.balance = (user.balance || 0) + job.reward;
        db.set('currentUser', user);
        
        // update users list
        let users = db.get('users', []);
        let idx = users.findIndex(u => u.username === user.username);
        if(idx !== -1) {
            users[idx] = user;
            db.set('users', users);
        }

        alert(`Task completed! Earned $${job.reward}`);
        ui.showTab('tasks');
    }
};

const wallet = {
    depositModal: () => {
        let amount = prompt("Enter deposit amount in USDT ($5 - $100):");
        if(amount) {
            alert(`Deposit request of $${amount} submitted! Please send USDT (BEP20) to admin and contact via Telegram (@jobaid2296).`);
        }
    },
    withdrawModal: () => {
        let amount = prompt("Enter withdrawal amount ($1 - $100):");
        let user = db.get('currentUser', {});
        if(amount) {
            if(parseFloat(amount) > user.balance) {
                alert('Insufficient balance!');
                return;
            }
            alert(`Withdrawal request of $${amount} submitted successfully. Processing within 24 hours.`);
        }
    }
};

window.onload = () => {
    auth.init();
};
