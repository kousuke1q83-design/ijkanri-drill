/* 海洋・港湾構造物維持管理士 学習サイト */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var TAK = window.TAKUITSU || [];
  var ANA = window.ANAUME || [];

  /* ---------- theme ---------- */
  var tt = document.getElementById("themeToggle");
  tt.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    var dark = cur ? cur === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
  });

  /* ---------- helpers ---------- */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function uniq(a) { var s = []; a.forEach(function (x) { if (s.indexOf(x) < 0) s.push(x); }); return s; }
  var MK = ["①", "②", "③", "④", "⑤"];

  function yearLabel(y) {
    if (y === "予想") return "令和8 予想";
    if (/^\d{4}$/.test(y)) return y + "年度";
    if (/^H\d+$/.test(y)) return "平成" + (+y.slice(1)) + "年度";
    return y;
  }
  function yearOrder() {
    var ys = uniq(TAK.map(function (q) { return q.year; }));
    var pred = ys.filter(function (y) { return y === "予想"; });
    var west = ys.filter(function (y) { return /^\d{4}$/.test(y); }).sort(function (a, b) { return b - a; });
    var h = ys.filter(function (y) { return /^H\d+$/.test(y); }).sort(function (a, b) { return b.slice(1) - a.slice(1); });
    return pred.concat(west, h);
  }

  function norm(s) {
    if (s == null) return "";
    s = String(s).trim().replace(/\s+/g, "").replace(/[・、，,。.]/g, "");
    s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
    return s.toLowerCase();
  }

  /* ========================================================= HOME */
  function home() {
    app.innerHTML = "";
    var nPast = TAK.filter(function (q) { return q.src === "past"; }).length;
    var nPred = TAK.filter(function (q) { return q.src === "pred"; }).length;
    var v = el('<section class="view"></section>');
    v.appendChild(el(
      '<div class="hero">' +
      '<h1>海洋・港湾構造物維持管理士<br>学習サイト</h1>' +
      '<p>択一式の過去問・予想問題と、記述式対策の穴埋め問題を解いて実力を固めましょう。</p>' +
      '</div>'
    ));
    var grid = el('<div class="mode-grid"></div>');

    var c1 = el(
      '<button class="mode-card" id="goTak">' +
      '<div class="ic">📝</div><h2>択一演習</h2>' +
      '<p>四肢択一を1問ずつ解き、その場で正誤と選択肢ごとの解説を確認。年度・出題範囲・問題数を選べます。</p>' +
      '<span class="count">全' + TAK.length + '問（過去問' + nPast + '・予想' + nPred + '）</span>' +
      '</button>'
    );
    c1.addEventListener("click", takSetup);

    var c2 = el(
      '<button class="mode-card" id="goAna">' +
      '<div class="ic">✍️</div><h2>穴埋め演習</h2>' +
      '<p>記述式でよく問われる重要語句・数値の空欄をタップして答えを確認。暗記カード方式で解説も読めます。</p>' +
      '<span class="count">全' + ANA.length + 'テーマ</span>' +
      '</button>'
    );
    c2.addEventListener("click", anaSetup);

    grid.appendChild(c1); grid.appendChild(c2);
    v.appendChild(grid);
    app.appendChild(v);
    window.scrollTo(0, 0);
  }

  /* ========================================================= 択一 SETUP */
  var takState = { years: [], src: "both", count: 10 };

  function takSetup() {
    app.innerHTML = "";
    var years = yearOrder();
    if (takState.years.length === 0) takState.years = years.slice();

    var v = el('<section class="view"></section>');
    v.appendChild(el('<div class="crumbs"><a id="bk">← トップ</a></div>'));
    v.appendChild(el('<h2 style="margin:.1em 0 .2em">択一演習の設定</h2>'));

    var p = el('<div class="panel"></div>');

    // 出題範囲
    p.appendChild(el('<div class="field"><label class="lbl">出題範囲</label>' +
      '<div class="seg" id="segSrc">' +
      '<button data-v="both" class="on">両方</button>' +
      '<button data-v="past">過去問のみ</button>' +
      '<button data-v="pred">予想のみ</button>' +
      '</div></div>'));

    // 年度
    var yWrap = el('<div class="field"><label class="lbl">年度（タップで選択／解除）</label></div>');
    var qa = el('<div style="margin-bottom:8px"><button class="hintbtn" id="selAll">すべて選択</button> ｜ <button class="hintbtn" id="selNone">すべて解除</button> ｜ <button class="hintbtn" id="selRecent">直近3年</button></div>');
    yWrap.appendChild(qa);
    var chips = el('<div class="chips" id="yearChips"></div>');
    years.forEach(function (y) {
      var on = takState.years.indexOf(y) >= 0;
      var c = el('<label class="chip' + (on ? ' on' : '') + '" data-y="' + esc(y) + '">' + esc(yearLabel(y)) + '</label>');
      c.addEventListener("click", function () { c.classList.toggle("on"); updateCount(); });
      chips.appendChild(c);
    });
    yWrap.appendChild(chips);
    p.appendChild(yWrap);

    // 問題数
    p.appendChild(el('<div class="field"><label class="lbl">問題数</label>' +
      '<div class="num-row" id="numRow">' +
      '<button data-n="10" class="on">10問</button>' +
      '<button data-n="20">20問</button>' +
      '<button data-n="30">30問</button>' +
      '<button data-n="9999">全部</button>' +
      '</div></div>'));

    var avail = el('<p class="note" id="avail" style="color:var(--muted);font-size:13px;margin:6px 0 0"></p>');
    p.appendChild(avail);
    var start = el('<div class="btn-row"><button class="btn" id="start">演習をはじめる ▶</button></div>');
    p.appendChild(start);
    v.appendChild(p);
    app.appendChild(v);
    window.scrollTo(0, 0);

    v.querySelector("#bk").addEventListener("click", home);
    v.querySelectorAll("#segSrc button").forEach(function (b) {
      b.addEventListener("click", function () {
        v.querySelectorAll("#segSrc button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); takState.src = b.dataset.v; updateCount();
      });
    });
    v.querySelectorAll("#numRow button").forEach(function (b) {
      b.addEventListener("click", function () {
        v.querySelectorAll("#numRow button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); takState.count = +b.dataset.n;
      });
    });
    function setChips(fn) {
      v.querySelectorAll("#yearChips .chip").forEach(function (c) { fn(c); });
      updateCount();
    }
    v.querySelector("#selAll").addEventListener("click", function () { setChips(function (c) { c.classList.add("on"); }); });
    v.querySelector("#selNone").addEventListener("click", function () { setChips(function (c) { c.classList.remove("on"); }); });
    v.querySelector("#selRecent").addEventListener("click", function () {
      var keep = ["2025", "2024", "2023"];
      setChips(function (c) { c.classList.toggle("on", keep.indexOf(c.dataset.y) >= 0); });
    });

    function selYears() { return Array.prototype.map.call(v.querySelectorAll("#yearChips .chip.on"), function (c) { return c.dataset.y; }); }
    function pool() {
      var ys = selYears();
      return TAK.filter(function (q) {
        if (takState.src !== "both" && q.src !== takState.src) return false;
        return ys.indexOf(q.year) >= 0;
      });
    }
    function updateCount() {
      var n = pool().length;
      avail.textContent = "該当する問題：" + n + "問";
      v.querySelector("#start").disabled = n === 0;
    }
    updateCount();

    start.addEventListener("click", function () {
      var pl = pool(); if (!pl.length) return;
      takState.years = selYears();
      var qs = shuffle(pl);
      if (takState.count < qs.length) qs = qs.slice(0, takState.count);
      takRun(qs);
    });
  }

  /* ========================================================= 択一 QUIZ */
  function takRun(qs) {
    var idx = 0, answers = new Array(qs.length).fill(null);

    function render() {
      app.innerHTML = "";
      var q = qs[idx];
      var v = el('<section class="view"></section>');
      v.appendChild(el('<div class="crumbs"><a id="quit">← 設定に戻る</a></div>'));

      var top = el('<div class="qtop"></div>');
      top.appendChild(el('<span class="qcount">第 ' + (idx + 1) + ' / ' + qs.length + ' 問</span>'));
      top.appendChild(el('<span>' +
        '<span class="badge ' + (q.src === "past" ? "past" : "pred") + '">' + esc(yearLabel(q.year)) + (q.src === "past" ? "" : "") + '</span>' +
        (q.kind ? '<span class="badge field">' + esc(q.kind) + '</span>' : '') + '</span>'));
      v.appendChild(top);

      v.appendChild(el('<div class="progress"><i style="width:' + ((idx) / qs.length * 100) + '%"></i></div>'));

      var card = el('<div class="qcard"></div>');
      card.appendChild(el('<div class="qtext">' + esc(q.q) + '</div>'));
      if (q.img) {
        var fig = el('<div class="qfig"></div>');
        var im = document.createElement("img"); im.src = q.img; im.alt = "図"; im.loading = "lazy";
        fig.appendChild(im); card.appendChild(fig);
      }
      var ch = el('<div class="choices"></div>');
      q.choices.forEach(function (text, i) {
        var c = el('<div class="choice" data-i="' + i + '"><span class="mk">' + MK[i] + '</span><span class="ctext">' + esc(text) + '</span></div>');
        c.addEventListener("click", function () { pick(i); });
        ch.appendChild(c);
      });
      card.appendChild(ch);
      var expHost = el('<div id="expHost"></div>');
      card.appendChild(expHost);
      v.appendChild(card);

      var nav = el('<div class="btn-row"></div>');
      var nextBtn = el('<button class="btn" id="next" disabled>' + (idx === qs.length - 1 ? "結果を見る" : "次の問題へ ▶") + '</button>');
      nav.appendChild(nextBtn);
      if (idx > 0) { var pv = el('<button class="btn sec" id="prev">◀ 前へ</button>'); nav.appendChild(pv); }
      v.appendChild(nav);
      app.appendChild(v);
      window.scrollTo(0, 0);

      v.querySelector("#quit").addEventListener("click", function () { takSetup(); });
      if (v.querySelector("#prev")) v.querySelector("#prev").addEventListener("click", function () { idx--; render(); });
      nextBtn.addEventListener("click", function () {
        if (idx === qs.length - 1) takResult(qs, answers);
        else { idx++; render(); }
      });

      if (answers[idx] !== null) lockUI(answers[idx]);

      function pick(i) { if (answers[idx] !== null) return; answers[idx] = i; lockUI(i); }
      function lockUI(chosen) {
        var nodes = ch.querySelectorAll(".choice");
        nodes.forEach(function (n) {
          n.classList.add("disabled");
          var ni = +n.dataset.i;
          if (ni === q.ans) n.classList.add("correct");
          if (ni === chosen && chosen !== q.ans) n.classList.add("wrong");
          if (ni === chosen) n.classList.add("sel");
          // per-choice explanation
          if (q.cexp && q.cexp[ni]) {
            n.appendChild(el('<div class="cexp">' + esc(q.cexp[ni]) + '</div>'));
          }
        });
        var ok = chosen === q.ans;
        expHost.innerHTML = "";
        var box = el('<div class="explain">' +
          '<div class="verdict ' + (ok ? "ok" : "ng") + '">' + (ok ? "正解！" : "不正解") + '（正答：' + MK[q.ans] + '）</div>' +
          (q.exp ? '<div><b>ポイント：</b>' + esc(q.exp) + '</div>' : '') + '</div>');
        expHost.appendChild(box);
        v.querySelector("#next").disabled = false;
        v.querySelector(".progress > i").style.width = ((idx + 1) / qs.length * 100) + "%";
      }
    }
    render();
  }

  function takResult(qs, answers) {
    app.innerHTML = "";
    var correct = 0;
    qs.forEach(function (q, i) { if (answers[i] === q.ans) correct++; });
    var pct = Math.round(correct / qs.length * 100);
    var v = el('<section class="view"></section>');
    var r = el('<div class="result"></div>');
    r.appendChild(el('<div class="scorebig">' + correct + '<small> / ' + qs.length + '問</small></div>'));
    r.appendChild(el('<p style="font-size:18px;font-weight:700;color:var(--accent);margin:6px 0 0">正答率 ' + pct + '%</p>'));
    var msg = pct >= 80 ? "合格ラインです。この調子！" : pct >= 60 ? "あと一歩。間違えた問題を復習しましょう。" : "基準書で基礎を固めて再挑戦しましょう。";
    r.appendChild(el('<p style="color:var(--muted);margin:4px 0 0">' + msg + '</p>'));

    var btns = el('<div class="btn-row" style="justify-content:center"></div>');
    var again = el('<button class="btn teal">同じ条件でもう一度</button>');
    again.addEventListener("click", function () { takRun(shuffle(qs)); });
    var reset = el('<button class="btn sec">条件を変える</button>');
    reset.addEventListener("click", takSetup);
    var h = el('<button class="btn sec">トップへ</button>');
    h.addEventListener("click", home);
    btns.appendChild(again); btns.appendChild(reset); btns.appendChild(h);
    r.appendChild(btns);

    var rev = el('<div class="review"><h3>解答の振り返り</h3></div>');
    qs.forEach(function (q, i) {
      var ok = answers[i] === q.ans;
      var it = el('<div class="review-item"></div>');
      it.appendChild(el('<div class="rq">' + (ok ? "✅" : "❌") + " <span style=\"color:var(--muted);font-weight:600\">[" + esc(yearLabel(q.year)) + "]</span> " + esc(q.q.length > 56 ? q.q.slice(0, 56) + "…" : q.q) + '</div>'));
      var you = answers[i] === null ? "未回答" : MK[answers[i]];
      it.appendChild(el('<div class="ra"><span class="you">あなた：' + esc(you) + '</span>　<span class="cor">正答：' + MK[q.ans] + '</span></div>'));
      if (q.exp) it.appendChild(el('<div class="ra" style="color:var(--muted)">' + esc(q.exp) + '</div>'));
      rev.appendChild(it);
    });
    r.appendChild(rev);
    v.appendChild(r);
    app.appendChild(v);
    window.scrollTo(0, 0);
  }

  /* ========================================================= 穴埋め SETUP */
  var anaState = { themes: [], count: 8 };

  function anaSetup() {
    app.innerHTML = "";
    var themes = uniq(ANA.map(function (x) { return x.theme; }));
    if (anaState.themes.length === 0) anaState.themes = themes.slice();

    var v = el('<section class="view"></section>');
    v.appendChild(el('<div class="crumbs"><a id="bk">← トップ</a></div>'));
    v.appendChild(el('<h2 style="margin:.1em 0 .2em">穴埋め演習の設定</h2>'));
    var p = el('<div class="panel"></div>');

    var fieldWrap = el('<div class="field"><label class="lbl">テーマ（タップで選択／解除）</label></div>');
    var chips = el('<div class="chips" id="thChips"></div>');
    themes.forEach(function (t) {
      var c = el('<label class="chip on" data-t="' + esc(t) + '">' + esc(t) + '</label>');
      c.addEventListener("click", function () { c.classList.toggle("on"); updateCount(); });
      chips.appendChild(c);
    });
    fieldWrap.appendChild(chips); p.appendChild(fieldWrap);

    p.appendChild(el('<div class="field"><label class="lbl">出題数</label>' +
      '<div class="num-row" id="numRow">' +
      '<button data-n="5">5問</button>' +
      '<button data-n="8" class="on">8問</button>' +
      '<button data-n="999">全部</button>' +
      '</div></div>'));

    var avail = el('<p class="note" id="avail" style="color:var(--muted);font-size:13px;margin:6px 0 0"></p>');
    p.appendChild(avail);
    var start = el('<div class="btn-row"><button class="btn" id="start">演習をはじめる ▶</button></div>');
    p.appendChild(start);
    v.appendChild(p); app.appendChild(v);
    window.scrollTo(0, 0);

    v.querySelector("#bk").addEventListener("click", home);
    v.querySelectorAll("#numRow button").forEach(function (b) {
      b.addEventListener("click", function () {
        v.querySelectorAll("#numRow button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); anaState.count = +b.dataset.n;
      });
    });
    function selTh() { return Array.prototype.map.call(v.querySelectorAll("#thChips .chip.on"), function (c) { return c.dataset.t; }); }
    function pool() { var ts = selTh(); return ANA.filter(function (x) { return ts.indexOf(x.theme) >= 0; }); }
    function updateCount() { var n = pool().length; avail.textContent = "該当するテーマ：" + n + "問"; v.querySelector("#start").disabled = n === 0; }
    updateCount();
    start.addEventListener("click", function () {
      var pl = pool(); if (!pl.length) return;
      anaState.themes = selTh();
      var qs = shuffle(pl);
      if (anaState.count < qs.length) qs = qs.slice(0, anaState.count);
      anaRun(qs);
    });
  }

  /* ========================================================= 穴埋め RUN（タップで表示） */
  function anaRun(items) {
    app.innerHTML = "";
    var v = el('<section class="view"></section>');
    v.appendChild(el('<div class="crumbs"><a id="bk">← 設定に戻る</a></div>'));
    v.appendChild(el('<h2 style="margin:.1em 0 .4em">穴埋め演習（' + items.length + '問）</h2>'));
    v.appendChild(el('<p class="note" style="color:var(--muted);font-size:13px;margin:0 0 10px">空欄（<span style="color:var(--accent);font-weight:700">？</span>）をタップすると答えが表示されます。もう一度タップで隠せます。</p>'));

    var ctl = el('<div class="btn-row" style="margin:0 0 4px"></div>');
    var showAll = el('<button class="btn sec">すべて表示</button>');
    var hideAll = el('<button class="btn sec">すべて隠す</button>');
    ctl.appendChild(showAll); ctl.appendChild(hideAll);
    v.appendChild(ctl);

    var host = el('<div id="anaHost" style="margin-top:14px"></div>');
    items.forEach(function (it, qi) {
      var card = el('<div class="ana-item"></div>');
      card.appendChild(el('<span class="theme">' + esc(it.theme) + '</span>'));
      var frag = document.createElement("div");
      frag.className = "ana-text";
      var parts = it.text.split(/(【\d+】)/);
      parts.forEach(function (seg) {
        var m = seg.match(/^【(\d+)】$/);
        if (m) {
          var bi = +m[1] - 1;
          var ansArr = (it.blanks[bi] && it.blanks[bi].ans) ? it.blanks[bi].ans : [""];
          var b = document.createElement("span");
          b.className = "ana-reveal";
          b.setAttribute("role", "button");
          b.setAttribute("tabindex", "0");
          b.setAttribute("data-ans", ansArr.join("／"));
          b.textContent = "？";
          var toggle = function () {
            var on = b.classList.toggle("on");
            b.textContent = on ? b.getAttribute("data-ans") : "？";
          };
          b.addEventListener("click", toggle);
          b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
          frag.appendChild(b);
        } else if (seg) {
          frag.appendChild(document.createTextNode(seg));
        }
      });
      card.appendChild(frag);

      var expBtn = el('<button class="hintbtn" style="margin-top:10px">解説を見る ▾</button>');
      var expBox = el('<div class="ana-exp2">' + esc(it.exp) + '</div>');
      expBtn.addEventListener("click", function () {
        var sh = expBox.classList.toggle("show");
        expBtn.textContent = sh ? "解説を隠す ▴" : "解説を見る ▾";
      });
      card.appendChild(expBtn);
      card.appendChild(expBox);
      host.appendChild(card);
    });
    v.appendChild(host);

    var nav = el('<div class="btn-row"></div>');
    var again = el('<button class="btn">シャッフルしてもう一度</button>');
    var reset = el('<button class="btn sec">条件を変える</button>');
    nav.appendChild(again); nav.appendChild(reset);
    v.appendChild(nav);
    app.appendChild(v);
    window.scrollTo(0, 0);

    v.querySelector("#bk").addEventListener("click", anaSetup);
    reset.addEventListener("click", anaSetup);
    again.addEventListener("click", function () { anaRun(shuffle(items)); });
    showAll.addEventListener("click", function () {
      v.querySelectorAll(".ana-reveal").forEach(function (b) { b.classList.add("on"); b.textContent = b.getAttribute("data-ans"); });
    });
    hideAll.addEventListener("click", function () {
      v.querySelectorAll(".ana-reveal").forEach(function (b) { b.classList.remove("on"); b.textContent = "？"; });
    });
  }

  /* ---------- boot ---------- */
  document.getElementById("brandLink").addEventListener("click", function (e) { e.preventDefault(); home(); });
  home();
})();
