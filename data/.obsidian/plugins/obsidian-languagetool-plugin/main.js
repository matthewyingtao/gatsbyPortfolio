"use strict";
var e = require("obsidian"),
  t = require("path"),
  n = require("@codemirror/tooltip"),
  r = require("@codemirror/view"),
  i = require("@codemirror/state"),
  o = require("@codemirror/language"),
  a = require("@codemirror/stream-parser");
function s(e) {
  return e && "object" == typeof e && "default" in e ? e : { default: e };
}
var c = s(t);
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ function u(
  e,
  t,
  n,
  r
) {
  return new (n || (n = Promise))(function (i, o) {
    function a(e) {
      try {
        c(r.next(e));
      } catch (e) {
        o(e);
      }
    }
    function s(e) {
      try {
        c(r.throw(e));
      } catch (e) {
        o(e);
      }
    }
    function c(e) {
      e.done
        ? i(e.value)
        : (function (e) {
            return e instanceof n
              ? e
              : new n(function (t) {
                  t(e);
                });
          })(e.value).then(a, s);
    }
    c((r = r.apply(e, t || [])).next());
  });
}
class l {
  constructor(e = {}) {
    if (!(e.maxSize && e.maxSize > 0))
      throw new TypeError("`maxSize` must be a number greater than 0");
    if ("number" == typeof e.maxAge && 0 === e.maxAge)
      throw new TypeError("`maxAge` must be a number greater than 0");
    (this.maxSize = e.maxSize),
      (this.maxAge = e.maxAge || Number.POSITIVE_INFINITY),
      (this.onEviction = e.onEviction),
      (this.cache = new Map()),
      (this.oldCache = new Map()),
      (this._size = 0);
  }
  _emitEvictions(e) {
    if ("function" == typeof this.onEviction)
      for (const [t, n] of e) this.onEviction(t, n.value);
  }
  _deleteIfExpired(e, t) {
    return (
      "number" == typeof t.expiry &&
      t.expiry <= Date.now() &&
      ("function" == typeof this.onEviction && this.onEviction(e, t.value),
      this.delete(e))
    );
  }
  _getOrDeleteIfExpired(e, t) {
    if (!1 === this._deleteIfExpired(e, t)) return t.value;
  }
  _getItemValue(e, t) {
    return t.expiry ? this._getOrDeleteIfExpired(e, t) : t.value;
  }
  _peek(e, t) {
    const n = t.get(e);
    return this._getItemValue(e, n);
  }
  _set(e, t) {
    this.cache.set(e, t),
      this._size++,
      this._size >= this.maxSize &&
        ((this._size = 0),
        this._emitEvictions(this.oldCache),
        (this.oldCache = this.cache),
        (this.cache = new Map()));
  }
  _moveToRecent(e, t) {
    this.oldCache.delete(e), this._set(e, t);
  }
  *_entriesAscending() {
    for (const e of this.oldCache) {
      const [t, n] = e;
      if (!this.cache.has(t)) {
        !1 === this._deleteIfExpired(t, n) && (yield e);
      }
    }
    for (const e of this.cache) {
      const [t, n] = e;
      !1 === this._deleteIfExpired(t, n) && (yield e);
    }
  }
  get(e) {
    if (this.cache.has(e)) {
      const t = this.cache.get(e);
      return this._getItemValue(e, t);
    }
    if (this.oldCache.has(e)) {
      const t = this.oldCache.get(e);
      if (!1 === this._deleteIfExpired(e, t))
        return this._moveToRecent(e, t), t.value;
    }
  }
  set(
    e,
    t,
    {
      maxAge: n = this.maxAge === Number.POSITIVE_INFINITY
        ? void 0
        : Date.now() + this.maxAge,
    } = {}
  ) {
    this.cache.has(e)
      ? this.cache.set(e, { value: t, maxAge: n })
      : this._set(e, { value: t, expiry: n });
  }
  has(e) {
    return this.cache.has(e)
      ? !this._deleteIfExpired(e, this.cache.get(e))
      : !!this.oldCache.has(e) &&
          !this._deleteIfExpired(e, this.oldCache.get(e));
  }
  peek(e) {
    return this.cache.has(e)
      ? this._peek(e, this.cache)
      : this.oldCache.has(e)
      ? this._peek(e, this.oldCache)
      : void 0;
  }
  delete(e) {
    const t = this.cache.delete(e);
    return t && this._size--, this.oldCache.delete(e) || t;
  }
  clear() {
    this.cache.clear(), this.oldCache.clear(), (this._size = 0);
  }
  resize(e) {
    if (!(e && e > 0))
      throw new TypeError("`maxSize` must be a number greater than 0");
    const t = [...this._entriesAscending()],
      n = t.length - e;
    n < 0
      ? ((this.cache = new Map(t)),
        (this.oldCache = new Map()),
        (this._size = t.length))
      : (n > 0 && this._emitEvictions(t.slice(0, n)),
        (this.oldCache = new Map(t.slice(n))),
        (this.cache = new Map()),
        (this._size = 0)),
      (this.maxSize = e);
  }
  *keys() {
    for (const [e] of this) yield e;
  }
  *values() {
    for (const [, e] of this) yield e;
  }
  *[Symbol.iterator]() {
    for (const e of this.cache) {
      const [t, n] = e;
      !1 === this._deleteIfExpired(t, n) && (yield [t, n.value]);
    }
    for (const e of this.oldCache) {
      const [t, n] = e;
      if (!this.cache.has(t)) {
        !1 === this._deleteIfExpired(t, n) && (yield [t, n.value]);
      }
    }
  }
  *entriesDescending() {
    let e = [...this.cache];
    for (let t = e.length - 1; t >= 0; --t) {
      const n = e[t],
        [r, i] = n;
      !1 === this._deleteIfExpired(r, i) && (yield [r, i.value]);
    }
    e = [...this.oldCache];
    for (let t = e.length - 1; t >= 0; --t) {
      const n = e[t],
        [r, i] = n;
      if (!this.cache.has(r)) {
        !1 === this._deleteIfExpired(r, i) && (yield [r, i.value]);
      }
    }
  }
  *entriesAscending() {
    for (const [e, t] of this._entriesAscending()) yield [e, t.value];
  }
  get size() {
    if (!this._size) return this.oldCache.size;
    let e = 0;
    for (const t of this.oldCache.keys()) this.cache.has(t) || e++;
    return Math.min(this._size + e, this.maxSize);
  }
}
const f = {
  serverUrl: "https://api.languagetool.org",
  glassBg: !1,
  shouldAutoCheck: !1,
  pickyMode: !1,
};
class p extends e.PluginSettingTab {
  constructor(e, t) {
    super(e, t), (this.plugin = t);
  }
  requestLanguages() {
    return u(this, void 0, void 0, function* () {
      if (this.languages) return this.languages;
      const e = yield fetch(
        `${this.plugin.settings.serverUrl}/v2/languages`
      ).then(e => e.json());
      return (this.languages = e), this.languages;
    });
  }
  display() {
    const { containerEl: t } = this;
    t.empty(),
      t.createEl("h2", { text: "Settings for LanguageTool" }),
      new e.Setting(t)
        .setName("Endpoint")
        .setDesc("Endpoint that will be used to make requests to")
        .then(e => {
          let t = null;
          e.addText(e => {
            (t = e),
              e
                .setPlaceholder("Enter endpoint")
                .setValue(this.plugin.settings.serverUrl)
                .onChange(e =>
                  u(this, void 0, void 0, function* () {
                    (this.plugin.settings.serverUrl = e
                      .replace(/\/v2\/check\/$/, "")
                      .replace(/\/$/, "")),
                      yield this.plugin.saveSettings();
                  })
                );
          }).addExtraButton(e => {
            e.setIcon("reset")
              .setTooltip("Reset to default")
              .onClick(() =>
                u(this, void 0, void 0, function* () {
                  (this.plugin.settings.serverUrl = f.serverUrl),
                    null == t || t.setValue(f.serverUrl),
                    yield this.plugin.saveSettings();
                })
              );
          });
        }),
      new e.Setting(t)
        .setName("Autocheck Text")
        .setDesc("Check text as you type")
        .addToggle(e => {
          e.setValue(this.plugin.settings.shouldAutoCheck).onChange(e =>
            u(this, void 0, void 0, function* () {
              (this.plugin.settings.shouldAutoCheck = e),
                yield this.plugin.saveSettings();
            })
          );
        }),
      new e.Setting(t)
        .setName("Glass Background")
        .setDesc(
          "Use the secondary background color of the theme or a glass background"
        )
        .addToggle(e => {
          e.setValue(this.plugin.settings.glassBg).onChange(e =>
            u(this, void 0, void 0, function* () {
              (this.plugin.settings.glassBg = e),
                yield this.plugin.saveSettings();
            })
          );
        }),
      new e.Setting(t)
        .setName("Static Language")
        .setDesc(
          "Set a static language that will always be used (LanguageTool tries to auto detect the language, this is usually not necessary)"
        )
        .addDropdown(e => {
          this.requestLanguages()
            .then(t => {
              var n;
              e.addOption("auto", "Auto Detect"),
                t.forEach(t => e.addOption(t.longCode, t.name)),
                e.setValue(
                  null !== (n = this.plugin.settings.staticLanguage) &&
                    void 0 !== n
                    ? n
                    : "auto"
                ),
                e.onChange(e =>
                  u(this, void 0, void 0, function* () {
                    (this.plugin.settings.staticLanguage = e),
                      yield this.plugin.saveSettings();
                  })
                );
            })
            .catch(console.error);
        }),
      t.createEl("h3", { text: "Rule Categories" }),
      new e.Setting(t)
        .setName("Picky Mode")
        .setDesc(
          "Provides more style and tonality suggestions, detects long or complex sentences, recognizes colloquialism and redundancies, proactively suggests synonyms for commonly overused words"
        )
        .addToggle(e => {
          e.setValue(this.plugin.settings.pickyMode).onChange(e =>
            u(this, void 0, void 0, function* () {
              (this.plugin.settings.pickyMode = e),
                yield this.plugin.saveSettings();
            })
          );
        }),
      new e.Setting(t)
        .setName("Other rule categories")
        .setDesc("Enter a comma-separated list of categories")
        .addText(e =>
          e
            .setPlaceholder("Eg. CATEGORY_1,CATEGORY_2")
            .setValue(this.plugin.settings.ruleOtherCategories || "")
            .onChange(e =>
              u(this, void 0, void 0, function* () {
                (this.plugin.settings.ruleOtherCategories = e.replace(
                  /\s+/g,
                  ""
                )),
                  yield this.plugin.saveSettings();
              })
            )
        )
        .then(e => {
          e.descEl.createEl("br"),
            e.descEl.createEl(
              "a",
              {
                text: "Click here for a list of rules and categories",
                href: "https://community.languagetool.org/rule/list",
              },
              e => {
                e.setAttr("target", "_blank");
              }
            );
        }),
      new e.Setting(t)
        .setName("Enable Specific Rules")
        .setDesc("Enter a comma-separated list of rules")
        .addText(e =>
          e
            .setPlaceholder("Eg. RULE_1,RULE_2")
            .setValue(this.plugin.settings.ruleOtherRules || "")
            .onChange(e =>
              u(this, void 0, void 0, function* () {
                (this.plugin.settings.ruleOtherRules = e.replace(/\s+/g, "")),
                  yield this.plugin.saveSettings();
              })
            )
        )
        .then(e => {
          e.descEl.createEl("br"),
            e.descEl.createEl(
              "a",
              {
                text: "Click here for a list of rules and categories",
                href: "https://community.languagetool.org/rule/list",
              },
              e => {
                e.setAttr("target", "_blank");
              }
            );
        }),
      new e.Setting(t)
        .setName("Disable Specific Rules")
        .setDesc("Enter a comma-separated list of rules")
        .addText(e =>
          e
            .setPlaceholder("Eg. RULE_1,RULE_2")
            .setValue(this.plugin.settings.ruleOtherDisabledRules || "")
            .onChange(e =>
              u(this, void 0, void 0, function* () {
                (this.plugin.settings.ruleOtherDisabledRules = e.replace(
                  /\s+/g,
                  ""
                )),
                  yield this.plugin.saveSettings();
              })
            )
        )
        .then(e => {
          e.descEl.createEl("br"),
            e.descEl.createEl(
              "a",
              {
                text: "Click here for a list of rules and categories",
                href: "https://community.languagetool.org/rule/list",
              },
              e => {
                e.setAttr("target", "_blank");
              }
            );
        }),
      new e.Setting(t)
        .setName("API Username")
        .setDesc("Enter a username/email for API Access")
        .addText(e =>
          e
            .setPlaceholder("peterlustig@gmail.com")
            .setValue(this.plugin.settings.username || "")
            .onChange(e =>
              u(this, void 0, void 0, function* () {
                (this.plugin.settings.username = e.replace(/\s+/g, "")),
                  yield this.plugin.saveSettings();
              })
            )
        )
        .then(e => {
          e.descEl.createEl("br"),
            e.descEl.createEl(
              "a",
              {
                text: "Click here for information about Premium Access",
                href: "https://github.com/Clemens-E/obsidian-languagetool-plugin#premium-accounts",
              },
              e => {
                e.setAttr("target", "_blank");
              }
            );
        }),
      new e.Setting(t)
        .setName("API Key")
        .setDesc("Enter an API Key")
        .addText(e =>
          e.setValue(this.plugin.settings.apikey || "").onChange(e =>
            u(this, void 0, void 0, function* () {
              (this.plugin.settings.apikey = e.replace(/\s+/g, "")),
                yield this.plugin.saveSettings();
            })
          )
        )
        .then(e => {
          e.descEl.createEl("br"),
            e.descEl.createEl(
              "a",
              {
                text: "Click here for information about Premium Access",
                href: "https://github.com/Clemens-E/obsidian-languagetool-plugin#premium-accounts",
              },
              e => {
                e.setAttr("target", "_blank");
              }
            );
        });
  }
}
const d = /frontmatter|code|math|templater|blockid|hashtag|internal/;
function h(e) {
  let t = 0;
  if (0 === e.length) return t;
  for (let n = 0; n < e.length; n++) {
    (t = (t << 5) - t + e.charCodeAt(n)), (t &= t);
  }
  return t;
}
function g(e) {
  switch (e) {
    case "COLLOQUIALISMS":
    case "REDUNDANCY":
    case "STYLE":
      return "lt-style";
    case "PUNCTUATION":
    case "TYPOS":
      return "lt-major";
  }
  return "lt-minor";
}
function m(e) {
  var t = { exports: {} };
  return e(t, t.exports), t.exports;
}
var v = m(function (e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 }),
      (t.defaults =
        t.composeannotation =
        t.collecttextnodes =
        t.build =
          void 0);
    const n = {
      children: e => e.children,
      annotatetextnode: (e, t) =>
        "text" === e.type
          ? {
              offset: {
                end: e.position.end.offset,
                start: e.position.start.offset,
              },
              text: t.substring(e.position.start.offset, e.position.end.offset),
            }
          : null,
      interpretmarkup: (e = "") => e,
    };
    function r(e, t, r = n) {
      const i = [];
      return (
        (function e(n) {
          const o = r.annotatetextnode(n, t);
          null !== o && i.push(o);
          const a = r.children(n);
          null !== a && Array.isArray(a) && a.forEach(e);
        })(e),
        i
      );
    }
    function i(e, t, r = n) {
      const i = [];
      let o = { offset: { end: 0, start: 0 } };
      for (const n of t) {
        const t = e.substring(o.offset.end, n.offset.start);
        i.push({
          interpretAs: r.interpretmarkup(t),
          markup: t,
          offset: { end: n.offset.start, start: o.offset.end },
        }),
          i.push(n),
          (o = n);
      }
      const a = e.substring(o.offset.end, e.length);
      return (
        i.push({
          interpretAs: r.interpretmarkup(a),
          markup: a,
          offset: { end: e.length, start: o.offset.end },
        }),
        { annotation: i }
      );
    }
    (t.defaults = n),
      (t.collecttextnodes = r),
      (t.composeannotation = i),
      (t.build = function (e, t, o = n) {
        return i(e, r(t(e), e, o), o);
      });
  }),
  y = m(function (e) {
    !(function () {
      var t;
      function n(e) {
        for (
          var t,
            n,
            r,
            i,
            o = 1,
            a = [].slice.call(arguments),
            s = 0,
            c = e.length,
            u = "",
            l = !1,
            f = !1,
            p = function () {
              return a[o++];
            },
            d = function () {
              for (var n = ""; /\d/.test(e[s]); ) (n += e[s++]), (t = e[s]);
              return n.length > 0 ? parseInt(n) : null;
            };
          s < c;
          ++s
        )
          if (((t = e[s]), l))
            switch (
              ((l = !1),
              "." == t
                ? ((f = !1), (t = e[++s]))
                : "0" == t && "." == e[s + 1]
                ? ((f = !0), (t = e[(s += 2)]))
                : (f = !0),
              (i = d()),
              t)
            ) {
              case "b":
                u += parseInt(p(), 10).toString(2);
                break;
              case "c":
                u +=
                  "string" == typeof (n = p()) || n instanceof String
                    ? n
                    : String.fromCharCode(parseInt(n, 10));
                break;
              case "d":
                u += parseInt(p(), 10);
                break;
              case "f":
                (r = String(parseFloat(p()).toFixed(i || 6))),
                  (u += f ? r : r.replace(/^0/, ""));
                break;
              case "j":
                u += JSON.stringify(p());
                break;
              case "o":
                u += "0" + parseInt(p(), 10).toString(8);
                break;
              case "s":
                u += p();
                break;
              case "x":
                u += "0x" + parseInt(p(), 10).toString(16);
                break;
              case "X":
                u += "0x" + parseInt(p(), 10).toString(16).toUpperCase();
                break;
              default:
                u += t;
            }
          else "%" === t ? (l = !0) : (u += t);
        return u;
      }
      ((t = e.exports = n).format = n),
        (t.vsprintf = function (e, t) {
          return n.apply(null, [e].concat(t));
        }),
        "undefined" != typeof console &&
          "function" == typeof console.log &&
          (t.printf = function () {
            console.log(n.apply(null, arguments));
          });
    })();
  }),
  x = b(Error),
  k = x;
function b(e) {
  return (t.displayName = e.displayName || e.name), t;
  function t(t) {
    return t && (t = y.apply(null, arguments)), new e(t);
  }
}
(x.eval = b(EvalError)),
  (x.range = b(RangeError)),
  (x.reference = b(ReferenceError)),
  (x.syntax = b(SyntaxError)),
  (x.type = b(TypeError)),
  (x.uri = b(URIError)),
  (x.create = b);
var w = function (e) {
    var t,
      n = e || "yaml",
      r = [],
      i = -1;
    ("string" != typeof n && "length" in n) || (n = [n]);
    t = n.length;
    for (; ++i < t; ) r[i] = A(n[i]);
    return r;
  },
  E = {}.hasOwnProperty,
  S = { yaml: "-", toml: "+" };
function A(e) {
  var t = e;
  if ("string" == typeof t) {
    if (!E.call(S, t)) throw k("Missing matter definition for `%s`", t);
    t = { type: t, marker: S[t] };
  } else if ("object" != typeof t)
    throw k("Expected matter to be an object, not `%j`", t);
  if (!E.call(t, "type")) throw k("Missing `type` in matter `%j`", t);
  if (!E.call(t, "fence") && !E.call(t, "marker"))
    throw k("Missing `marker` or `fence` in matter `%j`", t);
  return t;
}
function C(e) {
  var t,
    n = e.type,
    r = e.anywhere,
    i = n + "Value",
    o = n + "Fence",
    a = o + "Sequence",
    s = {
      tokenize: function (e, n, r) {
        var i = 0;
        return function (n) {
          if (n === t.charCodeAt(i)) return e.enter(o), e.enter(a), s(n);
          return r(n);
        };
        function s(n) {
          return i === t.length
            ? (e.exit(a),
              -2 === n || -1 === n || 32 === n
                ? (e.enter("whitespace"), c(n))
                : u(n))
            : n === t.charCodeAt(i)
            ? (e.consume(n), i++, s)
            : r(n);
        }
        function c(t) {
          return -2 === t || -1 === t || 32 === t
            ? (e.consume(t), c)
            : (e.exit("whitespace"), u(t));
        }
        function u(t) {
          return -5 === t || -4 === t || -3 === t || null === t
            ? (e.exit(o), n(t))
            : r(t);
        }
      },
      partial: !0,
    };
  return {
    tokenize: function (o, a, c) {
      var u = this;
      return function (i) {
        var a = u.now();
        if (1 !== a.column || (!r && 1 !== a.line)) return c(i);
        return o.enter(n), (t = q(e, "open")), o.attempt(s, l, c)(i);
      };
      function l(n) {
        return (t = q(e, "close")), d(n);
      }
      function f(e) {
        return -5 === e || -4 === e || -3 === e || null === e
          ? d(e)
          : (o.enter(i), p(e));
      }
      function p(e) {
        return -5 === e || -4 === e || -3 === e || null === e
          ? (o.exit(i), d(e))
          : (o.consume(e), p);
      }
      function d(e) {
        return null === e
          ? c(e)
          : (o.enter("lineEnding"),
            o.consume(e),
            o.exit("lineEnding"),
            o.attempt(s, h, f));
      }
      function h(e) {
        return o.exit(n), a(e);
      }
    },
    concrete: !0,
  };
}
function q(e, t) {
  var n;
  return e.marker ? (n = D(e.marker, t)) + n + n : D(e.fence, t);
}
function D(e, t) {
  return "string" == typeof e ? e : e[t];
}
var T = function (e) {
    var t,
      n,
      r = w(e),
      i = r.length,
      o = -1,
      a = {};
    for (; ++o < i; )
      (t = r[o]),
        (n = q(t, "open").charCodeAt(0)) in a
          ? a[n].push(C(t))
          : (a[n] = [C(t)]);
    return { flow: a };
  },
  L = function (e) {
    var t,
      n = w(e),
      r = n.length,
      i = -1,
      o = {},
      a = {};
    for (; ++i < r; )
      (t = n[i]),
        (o[t.type] = F(t)),
        (a[t.type] = I),
        (a[t.type + "Value"] = P);
    return { enter: o, exit: a };
  };
function F(e) {
  return function (t) {
    this.enter({ type: e.type, value: "" }, t), this.buffer();
  };
}
function I(e) {
  var t = this.resume();
  this.exit(e).value = t.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
}
function P(e) {
  this.config.enter.data.call(this, e), this.config.exit.data.call(this, e);
}
var R = function (e) {
  var t,
    n = [],
    r = {},
    i = w(e),
    o = i.length,
    a = -1;
  for (; ++a < o; )
    (t = i[a]),
      (r[t.type] = B(t)),
      n.push({ atBreak: !0, character: O(t, "open").charAt(0) });
  return { unsafe: n, handlers: r };
};
function B(e) {
  var t = O(e, "open"),
    n = O(e, "close");
  return function (e) {
    return t + (e.value ? "\n" + e.value : "") + "\n" + n;
  };
}
function O(e, t) {
  var n;
  return e.marker ? (n = z(e.marker, t)) + n + n : z(e.fence, t);
}
function z(e, t) {
  return "string" == typeof e ? e : e[t];
}
var _ = function (e) {
  var t = this.data();
  function n(e, n) {
    t[e] ? t[e].push(n) : (t[e] = [n]);
  }
  n("micromarkExtensions", T(e)),
    n("fromMarkdownExtensions", L(e)),
    n("toMarkdownExtensions", R(e));
};
var M = N;
function N(e) {
  return (
    (e &&
      (e.value ||
        e.alt ||
        e.title ||
        ("children" in e && V(e.children)) ||
        ("length" in e && V(e)))) ||
    ""
  );
}
function V(e) {
  for (var t = [], n = -1; ++n < e.length; ) t[n] = N(e[n]);
  return t.join("");
}
var U = Object.assign,
  j = {}.hasOwnProperty;
var H = function (e) {
    return e
      .replace(/[\t\n\r ]+/g, " ")
      .replace(/^ | $/g, "")
      .toLowerCase()
      .toUpperCase();
  },
  G = String.fromCharCode;
var W = function (e, t) {
  var n = parseInt(e, t);
  return n < 9 ||
    11 === n ||
    (n > 13 && n < 32) ||
    (n > 126 && n < 160) ||
    (n > 55295 && n < 57344) ||
    (n > 64975 && n < 65008) ||
    65535 == (65535 & n) ||
    65534 == (65535 & n) ||
    n > 1114111
    ? "�"
    : G(n);
};
var Q = function (e) {
  return e < -2;
};
var Y = function (e) {
  return -2 === e || -1 === e || 32 === e;
};
var $ = function (e, t, n, r) {
  var i = r ? r - 1 : 1 / 0,
    o = 0;
  return function (r) {
    if (Y(r)) return e.enter(n), a(r);
    return t(r);
  };
  function a(r) {
    return Y(r) && o++ < i ? (e.consume(r), a) : (e.exit(n), t(r));
  }
};
var J = function (e) {
    var t,
      n = e.attempt(
        this.parser.constructs.contentInitial,
        function (t) {
          if (null === t) return void e.consume(t);
          return (
            e.enter("lineEnding"),
            e.consume(t),
            e.exit("lineEnding"),
            $(e, n, "linePrefix")
          );
        },
        function (t) {
          return e.enter("paragraph"), r(t);
        }
      );
    return n;
    function r(n) {
      var r = e.enter("chunkText", { contentType: "text", previous: t });
      return t && (t.next = r), (t = r), i(n);
    }
    function i(t) {
      return null === t
        ? (e.exit("chunkText"), e.exit("paragraph"), void e.consume(t))
        : Q(t)
        ? (e.consume(t), e.exit("chunkText"), r)
        : (e.consume(t), i);
    }
  },
  Z = Object.defineProperty({ tokenize: J }, "__esModule", { value: !0 });
var K = {
    tokenize: function (e, t, n) {
      return $(
        e,
        function (e) {
          return null === e || Q(e) ? t(e) : n(e);
        },
        "linePrefix"
      );
    },
    partial: !0,
  },
  X = function (e) {
    var t,
      n,
      r,
      i = this,
      o = [],
      a = 0,
      s = {
        tokenize: function (e, r) {
          var a = 0;
          return (t = {}), s;
          function s(r) {
            return a < o.length
              ? ((i.containerState = o[a][1]),
                e.attempt(o[a][0].continuation, c, u)(r))
              : n.currentConstruct && n.currentConstruct.concrete
              ? ((t.flowContinue = !0), p(r))
              : ((i.interrupt =
                  n.currentConstruct && n.currentConstruct.interruptible),
                (i.containerState = {}),
                e.attempt(ee, f, p)(r));
          }
          function c(e) {
            return a++, i.containerState._closeFlow ? f(e) : s(e);
          }
          function u(t) {
            return n.currentConstruct && n.currentConstruct.lazy
              ? ((i.containerState = {}),
                e.attempt(ee, f, e.attempt(te, f, e.check(K, f, l)))(t))
              : f(t);
          }
          function l(e) {
            return (a = o.length), (t.lazy = !0), (t.flowContinue = !0), p(e);
          }
          function f(e) {
            return (t.flowEnd = !0), p(e);
          }
          function p(e) {
            return (
              (t.continued = a), (i.interrupt = i.containerState = void 0), r(e)
            );
          }
        },
        partial: !0,
      };
    return c;
    function c(t) {
      return a < o.length
        ? ((i.containerState = o[a][1]),
          e.attempt(o[a][0].continuation, u, l)(t))
        : l(t);
    }
    function u(e) {
      return a++, c(e);
    }
    function l(r) {
      return t && t.flowContinue
        ? p(r)
        : ((i.interrupt =
            n && n.currentConstruct && n.currentConstruct.interruptible),
          (i.containerState = {}),
          e.attempt(ee, f, p)(r));
    }
    function f(e) {
      return (
        o.push([i.currentConstruct, i.containerState]),
        (i.containerState = void 0),
        l(e)
      );
    }
    function p(t) {
      return null === t
        ? (m(0, !0), void e.consume(t))
        : ((n = n || i.parser.flow(i.now())),
          e.enter("chunkFlow", {
            contentType: "flow",
            previous: r,
            _tokenizer: n,
          }),
          d(t));
    }
    function d(t) {
      return null === t
        ? (g(e.exit("chunkFlow")), p(t))
        : Q(t)
        ? (e.consume(t), g(e.exit("chunkFlow")), e.check(s, h))
        : (e.consume(t), d);
    }
    function h(e) {
      return m(t.continued, t && t.flowEnd), (a = 0), c(e);
    }
    function g(e) {
      r && (r.next = e),
        (r = e),
        (n.lazy = t && t.lazy),
        n.defineSkip(e.start),
        n.write(i.sliceStream(e));
    }
    function m(t, a) {
      var s = o.length;
      for (n && a && (n.write([null]), (r = n = void 0)); s-- > t; )
        (i.containerState = o[s][1]), o[s][0].exit.call(i, e);
      o.length = t;
    }
  },
  ee = {
    tokenize: function (e, t, n) {
      return $(
        e,
        e.attempt(this.parser.constructs.document, t, n),
        "linePrefix",
        this.parser.constructs.disable.null.indexOf("codeIndented") > -1
          ? void 0
          : 4
      );
    },
  },
  te = {
    tokenize: function (e, t, n) {
      return $(
        e,
        e.lazy(this.parser.constructs.flow, t, n),
        "linePrefix",
        this.parser.constructs.disable.null.indexOf("codeIndented") > -1
          ? void 0
          : 4
      );
    },
  };
var ne = X,
  re = Object.defineProperty({ tokenize: ne }, "__esModule", { value: !0 });
var ie = function (e) {
  for (var t = -1, n = 0; ++t < e.length; )
    n += "string" == typeof e[t] ? e[t].length : 1;
  return n;
};
var oe = function (e, t) {
    var n = e[e.length - 1];
    return n && n[1].type === t ? ie(n[2].sliceStream(n[1])) : 0;
  },
  ae = [].splice;
var se = function (e, t, n, r) {
  var i,
    o = e.length,
    a = 0;
  if (
    ((t = t < 0 ? (-t > o ? 0 : o + t) : t > o ? o : t),
    (n = n > 0 ? n : 0),
    r.length < 1e4)
  )
    (i = Array.from(r)).unshift(t, n), ae.apply(e, i);
  else
    for (n && ae.apply(e, [t, n]); a < r.length; )
      (i = r.slice(a, a + 1e4)).unshift(t, 0),
        ae.apply(e, i),
        (a += 1e4),
        (t += 1e4);
};
var ce = function (e) {
  return U({}, e);
};
function ue(e, t) {
  for (
    var n,
      r,
      i,
      o,
      a,
      s,
      c = e[t][1],
      u = e[t][2],
      l = t - 1,
      f = [],
      p = c._tokenizer || u.parser[c.contentType](c.start),
      d = p.events,
      h = [],
      g = {};
    c;

  ) {
    for (; e[++l][1] !== c; );
    f.push(l),
      c._tokenizer ||
        ((n = u.sliceStream(c)),
        c.next || n.push(null),
        r && p.defineSkip(c.start),
        c.isInFirstContentOfListItem &&
          (p._gfmTasklistFirstContentOfListItem = !0),
        p.write(n),
        c.isInFirstContentOfListItem &&
          (p._gfmTasklistFirstContentOfListItem = void 0)),
      (r = c),
      (c = c.next);
  }
  for (c = r, i = d.length; i--; )
    "enter" === d[i][0]
      ? (o = !0)
      : o &&
        d[i][1].type === d[i - 1][1].type &&
        d[i][1].start.line !== d[i][1].end.line &&
        (m(d.slice(i + 1, a)),
        (c._tokenizer = c.next = void 0),
        (c = c.previous),
        (a = i + 1));
  for (
    p.events = c._tokenizer = c.next = void 0, m(d.slice(0, a)), i = -1, s = 0;
    ++i < h.length;

  )
    (g[s + h[i][0]] = s + h[i][1]), (s += h[i][1] - h[i][0] - 1);
  return g;
  function m(t) {
    var n = f.pop();
    h.unshift([n, n + t.length - 1]), se(e, n, 2, t);
  }
}
var le = function (e) {
    for (var t, n, r, i, o, a, s, c = {}, u = -1; ++u < e.length; ) {
      for (; u in c; ) u = c[u];
      if (
        ((t = e[u]),
        u &&
          "chunkFlow" === t[1].type &&
          "listItemPrefix" === e[u - 1][1].type &&
          ((r = 0) < (a = t[1]._tokenizer.events).length &&
            "lineEndingBlank" === a[r][1].type &&
            (r += 2),
          r < a.length && "content" === a[r][1].type))
      )
        for (; ++r < a.length && "content" !== a[r][1].type; )
          "chunkText" === a[r][1].type &&
            ((a[r][1].isInFirstContentOfListItem = !0), r++);
      if ("enter" === t[0])
        t[1].contentType && (U(c, ue(e, u)), (u = c[u]), (s = !0));
      else if (t[1]._container || t[1]._movePreviousLineEndings) {
        for (
          r = u, n = void 0;
          r-- &&
          ("lineEnding" === (i = e[r])[1].type ||
            "lineEndingBlank" === i[1].type);

        )
          "enter" === i[0] &&
            (n && (e[n][1].type = "lineEndingBlank"),
            (i[1].type = "lineEnding"),
            (n = r));
        n &&
          ((t[1].end = ce(e[n][1].start)),
          (o = e.slice(n, u)).unshift(t),
          se(e, n, u - n + 1, o));
      }
    }
    return !s;
  },
  fe = {
    tokenize: function (e, t) {
      var n;
      return function (t) {
        return (
          e.enter("content"),
          (n = e.enter("chunkContent", { contentType: "content" })),
          r(t)
        );
      };
      function r(t) {
        return null === t
          ? i(t)
          : Q(t)
          ? e.check(pe, o, i)(t)
          : (e.consume(t), r);
      }
      function i(n) {
        return e.exit("chunkContent"), e.exit("content"), t(n);
      }
      function o(t) {
        return (
          e.consume(t),
          e.exit("chunkContent"),
          (n = n.next =
            e.enter("chunkContent", { contentType: "content", previous: n })),
          r
        );
      }
    },
    resolve: function (e) {
      return le(e), e;
    },
    interruptible: !0,
    lazy: !0,
  },
  pe = {
    tokenize: function (e, t, n) {
      var r = this;
      return function (t) {
        return (
          e.enter("lineEnding"),
          e.consume(t),
          e.exit("lineEnding"),
          $(e, i, "linePrefix")
        );
      };
      function i(i) {
        return null === i || Q(i)
          ? n(i)
          : r.parser.constructs.disable.null.indexOf("codeIndented") > -1 ||
            oe(r.events, "linePrefix") < 4
          ? e.interrupt(r.parser.constructs.flow, n, t)(i)
          : t(i);
      }
    },
    partial: !0,
  };
var de = fe;
var he = function (e) {
    var t = this,
      n = e.attempt(
        K,
        function (r) {
          if (null === r) return void e.consume(r);
          return (
            e.enter("lineEndingBlank"),
            e.consume(r),
            e.exit("lineEndingBlank"),
            (t.currentConstruct = void 0),
            n
          );
        },
        e.attempt(
          this.parser.constructs.flowInitial,
          r,
          $(
            e,
            e.attempt(this.parser.constructs.flow, r, e.attempt(de, r)),
            "linePrefix"
          )
        )
      );
    return n;
    function r(r) {
      if (null !== r)
        return (
          e.enter("lineEnding"),
          e.consume(r),
          e.exit("lineEnding"),
          (t.currentConstruct = void 0),
          n
        );
      e.consume(r);
    }
  },
  ge = Object.defineProperty({ tokenize: he }, "__esModule", { value: !0 }),
  me = ye("text"),
  ve = ye("string");
function ye(e) {
  return {
    tokenize: function (t) {
      var n = this,
        r = this.parser.constructs[e],
        i = t.attempt(r, o, a);
      return o;
      function o(e) {
        return c(e) ? i(e) : a(e);
      }
      function a(e) {
        if (null !== e) return t.enter("data"), t.consume(e), s;
        t.consume(e);
      }
      function s(e) {
        return c(e) ? (t.exit("data"), i(e)) : (t.consume(e), s);
      }
      function c(e) {
        var t = r[e],
          i = -1;
        if (null === e) return !0;
        if (t)
          for (; ++i < t.length; )
            if (!t[i].previous || t[i].previous.call(n, n.previous)) return !0;
      }
    },
    resolveAll: xe("text" === e ? ke : void 0),
  };
}
function xe(e) {
  return function (t, n) {
    var r,
      i = -1;
    for (; ++i <= t.length; )
      void 0 === r
        ? t[i] && "data" === t[i][1].type && ((r = i), i++)
        : (t[i] && "data" === t[i][1].type) ||
          (i !== r + 2 &&
            ((t[r][1].end = t[i - 1][1].end),
            t.splice(r + 2, i - r - 2),
            (i = r + 2)),
          (r = void 0));
    return e ? e(t, n) : t;
  };
}
function ke(e, t) {
  for (var n, r, i, o, a, s, c, u, l = -1; ++l <= e.length; )
    if (
      (l === e.length || "lineEnding" === e[l][1].type) &&
      "data" === e[l - 1][1].type
    ) {
      for (
        r = e[l - 1][1],
          o = (n = t.sliceStream(r)).length,
          a = -1,
          s = 0,
          c = void 0;
        o--;

      )
        if ("string" == typeof (i = n[o])) {
          for (a = i.length; 32 === i.charCodeAt(a - 1); ) s++, a--;
          if (a) break;
          a = -1;
        } else if (-2 === i) (c = !0), s++;
        else if (-1 !== i) {
          o++;
          break;
        }
      s &&
        ((u = {
          type:
            l === e.length || c || s < 2 ? "lineSuffix" : "hardBreakTrailing",
          start: {
            line: r.end.line,
            column: r.end.column - s,
            offset: r.end.offset - s,
            _index: r.start._index + o,
            _bufferIndex: o ? a : r.start._bufferIndex + a,
          },
          end: ce(r.end),
        }),
        (r.end = ce(u.start)),
        r.start.offset === r.end.offset
          ? U(r, u)
          : (e.splice(l, 0, ["enter", u, t], ["exit", u, t]), (l += 2))),
        l++;
    }
  return e;
}
var be = { resolveAll: xe() },
  we = ve,
  Ee = me,
  Se = Object.defineProperty(
    { resolver: be, string: we, text: Ee },
    "__esModule",
    { value: !0 }
  );
var Ae = function (e) {
  return null == e ? [] : "length" in e ? e : [e];
};
function Ce(e, t) {
  var n, r, i, o;
  for (n in t)
    for (o in ((r = j.call(e, n) ? e[n] : (e[n] = {})), (i = t[n])))
      r[o] = qe(Ae(i[o]), j.call(r, o) ? r[o] : []);
}
function qe(e, t) {
  for (var n = -1, r = []; ++n < e.length; )
    ("after" === e[n].add ? t : r).push(e[n]);
  return se(t, 0, 0, r), t;
}
var De = function (e) {
  for (var t = {}, n = -1; ++n < e.length; ) Ce(t, e[n]);
  return t;
};
var Te = function (e, t) {
  return e.length ? (se(e, e.length, 0, t), e) : t;
};
var Le = function (e, t, n) {
  for (var r, i = [], o = -1; ++o < e.length; )
    (r = e[o].resolveAll) && i.indexOf(r) < 0 && ((t = r(t, n)), i.push(r));
  return t;
};
var Fe = function (e) {
  for (var t, n, r, i = -1, o = []; ++i < e.length; ) {
    if ("string" == typeof (t = e[i])) n = t;
    else if (-5 === t) n = "\r";
    else if (-4 === t) n = "\n";
    else if (-3 === t) n = "\r\n";
    else if (-2 === t) n = "\t";
    else if (-1 === t) {
      if (r) continue;
      n = " ";
    } else n = G(t);
    (r = -2 === t), o.push(n);
  }
  return o.join("");
};
var Ie = function (e, t) {
  var n,
    r = t.start._index,
    i = t.start._bufferIndex,
    o = t.end._index,
    a = t.end._bufferIndex;
  return (
    r === o
      ? (n = [e[r].slice(i, a)])
      : ((n = e.slice(r, o)),
        i > -1 && (n[0] = n[0].slice(i)),
        a > 0 && n.push(e[o].slice(0, a))),
    n
  );
};
var Pe = function (e, t, n) {
  var r = n ? ce(n) : { line: 1, column: 1, offset: 0 },
    i = {},
    o = [],
    a = [],
    s = [],
    c = {
      consume: function (e) {
        Q(e)
          ? (r.line++, (r.column = 1), (r.offset += -3 === e ? 2 : 1), y())
          : -1 !== e && (r.column++, r.offset++);
        r._bufferIndex < 0
          ? r._index++
          : (r._bufferIndex++,
            r._bufferIndex === a[r._index].length &&
              ((r._bufferIndex = -1), r._index++));
        u.previous = e;
      },
      enter: function (e, t) {
        var n = t || {};
        return (
          (n.type = e),
          (n.start = p()),
          u.events.push(["enter", n, u]),
          s.push(n),
          n
        );
      },
      exit: function (e) {
        var t = s.pop();
        return (t.end = p()), u.events.push(["exit", t, u]), t;
      },
      attempt: m(function (e, t) {
        v(e, t.from);
      }),
      check: m(g),
      interrupt: m(g, { interrupt: !0 }),
      lazy: m(g, { lazy: !0 }),
    },
    u = {
      previous: null,
      events: [],
      parser: e,
      sliceStream: f,
      sliceSerialize: function (e) {
        return Fe(f(e));
      },
      now: p,
      defineSkip: function (e) {
        (i[e.line] = e.column), y();
      },
      write: function (e) {
        if (((a = Te(a, e)), d(), null !== a[a.length - 1])) return [];
        return v(t, 0), (u.events = Le(o, u.events, u)), u.events;
      },
    },
    l = t.tokenize.call(u, c);
  return t.resolveAll && o.push(t), (r._index = 0), (r._bufferIndex = -1), u;
  function f(e) {
    return Ie(a, e);
  }
  function p() {
    return ce(r);
  }
  function d() {
    for (var e, t; r._index < a.length; )
      if ("string" == typeof (t = a[r._index]))
        for (
          e = r._index, r._bufferIndex < 0 && (r._bufferIndex = 0);
          r._index === e && r._bufferIndex < t.length;

        )
          h(t.charCodeAt(r._bufferIndex));
      else h(t);
  }
  function h(e) {
    l = l(e);
  }
  function g(e, t) {
    t.restore();
  }
  function m(e, t) {
    return function (n, i, o) {
      var a, l, f, d;
      return n.tokenize || "length" in n
        ? h(Ae(n))
        : function (e) {
            if (e in n || null in n)
              return h(n.null ? Ae(n[e]).concat(Ae(n.null)) : n[e])(e);
            return o(e);
          };
      function h(e) {
        return (a = e), g(e[(l = 0)]);
      }
      function g(e) {
        return function (n) {
          (d = (function () {
            var e = p(),
              t = u.previous,
              n = u.currentConstruct,
              i = u.events.length,
              o = Array.from(s);
            return { restore: a, from: i };
            function a() {
              (r = e),
                (u.previous = t),
                (u.currentConstruct = n),
                (u.events.length = i),
                (s = o),
                y();
            }
          })()),
            (f = e),
            e.partial || (u.currentConstruct = e);
          if (e.name && u.parser.constructs.disable.null.indexOf(e.name) > -1)
            return v();
          return e.tokenize.call(t ? U({}, u, t) : u, c, m, v)(n);
        };
      }
      function m(t) {
        return e(f, d), i;
      }
      function v(e) {
        return d.restore(), ++l < a.length ? g(a[l]) : o;
      }
    };
  }
  function v(e, t) {
    e.resolveAll && o.indexOf(e) < 0 && o.push(e),
      e.resolve &&
        se(u.events, t, u.events.length - t, e.resolve(u.events.slice(t), u)),
      e.resolveTo && (u.events = e.resolveTo(u.events, u));
  }
  function y() {
    r.line in i &&
      r.column < 2 &&
      ((r.column = i[r.line]), (r.offset += i[r.line] - 1));
  }
};
var Re = function (e) {
  return e < 0 || 32 === e;
};
var Be = function (e) {
    return function (t) {
      return e.test(G(t));
    };
  },
  Oe = Be(
    /[!-\/:-@\[-`\{-~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]/
  ),
  ze = Be(/\s/);
var _e = function (e) {
  return null === e || Re(e) || ze(e) ? 1 : Oe(e) ? 2 : void 0;
};
var Me = function (e, t) {
  return (e.column += t), (e.offset += t), (e._bufferIndex += t), e;
};
var Ne = {
    name: "attention",
    tokenize: function (e, t) {
      var n,
        r = _e(this.previous);
      return function (t) {
        return e.enter("attentionSequence"), (n = t), i(t);
      };
      function i(o) {
        var a, s, c, u;
        return o === n
          ? (e.consume(o), i)
          : ((a = e.exit("attentionSequence")),
            (c = !(s = _e(o)) || (2 === s && r)),
            (u = !r || (2 === r && s)),
            (a._open = 42 === n ? c : c && (r || !u)),
            (a._close = 42 === n ? u : u && (s || !c)),
            t(o));
      }
    },
    resolveAll: function (e, t) {
      var n,
        r,
        i,
        o,
        a,
        s,
        c,
        u,
        l = -1;
      for (; ++l < e.length; )
        if (
          "enter" === e[l][0] &&
          "attentionSequence" === e[l][1].type &&
          e[l][1]._close
        )
          for (n = l; n--; )
            if (
              "exit" === e[n][0] &&
              "attentionSequence" === e[n][1].type &&
              e[n][1]._open &&
              t.sliceSerialize(e[n][1]).charCodeAt(0) ===
                t.sliceSerialize(e[l][1]).charCodeAt(0)
            ) {
              if (
                (e[n][1]._close || e[l][1]._open) &&
                (e[l][1].end.offset - e[l][1].start.offset) % 3 &&
                !(
                  (e[n][1].end.offset -
                    e[n][1].start.offset +
                    e[l][1].end.offset -
                    e[l][1].start.offset) %
                  3
                )
              )
                continue;
              (s =
                e[n][1].end.offset - e[n][1].start.offset > 1 &&
                e[l][1].end.offset - e[l][1].start.offset > 1
                  ? 2
                  : 1),
                (o = {
                  type: s > 1 ? "strongSequence" : "emphasisSequence",
                  start: Me(ce(e[n][1].end), -s),
                  end: ce(e[n][1].end),
                }),
                (a = {
                  type: s > 1 ? "strongSequence" : "emphasisSequence",
                  start: ce(e[l][1].start),
                  end: Me(ce(e[l][1].start), s),
                }),
                (i = {
                  type: s > 1 ? "strongText" : "emphasisText",
                  start: ce(e[n][1].end),
                  end: ce(e[l][1].start),
                }),
                (r = {
                  type: s > 1 ? "strong" : "emphasis",
                  start: ce(o.start),
                  end: ce(a.end),
                }),
                (e[n][1].end = ce(o.start)),
                (e[l][1].start = ce(a.end)),
                (c = []),
                e[n][1].end.offset - e[n][1].start.offset &&
                  (c = Te(c, [
                    ["enter", e[n][1], t],
                    ["exit", e[n][1], t],
                  ])),
                (c = Te(c, [
                  ["enter", r, t],
                  ["enter", o, t],
                  ["exit", o, t],
                  ["enter", i, t],
                ])),
                (c = Te(
                  c,
                  Le(t.parser.constructs.insideSpan.null, e.slice(n + 1, l), t)
                )),
                (c = Te(c, [
                  ["exit", i, t],
                  ["enter", a, t],
                  ["exit", a, t],
                  ["exit", r, t],
                ])),
                e[l][1].end.offset - e[l][1].start.offset
                  ? ((u = 2),
                    (c = Te(c, [
                      ["enter", e[l][1], t],
                      ["exit", e[l][1], t],
                    ])))
                  : (u = 0),
                se(e, n - 1, l - n + 3, c),
                (l = n + c.length - u - 2);
              break;
            }
      l = -1;
      for (; ++l < e.length; )
        "attentionSequence" === e[l][1].type && (e[l][1].type = "data");
      return e;
    },
  },
  Ve = Be(/[A-Za-z]/),
  Ue = Be(/[\dA-Za-z]/),
  je = Be(/[#-'*+\--9=?A-Z^-~]/);
var He = function (e) {
  return e < 32 || 127 === e;
};
var Ge = {
    name: "autolink",
    tokenize: function (e, t, n) {
      var r = 1;
      return function (t) {
        return (
          e.enter("autolink"),
          e.enter("autolinkMarker"),
          e.consume(t),
          e.exit("autolinkMarker"),
          e.enter("autolinkProtocol"),
          i
        );
      };
      function i(t) {
        return Ve(t) ? (e.consume(t), o) : je(t) ? c(t) : n(t);
      }
      function o(e) {
        return 43 === e || 45 === e || 46 === e || Ue(e) ? a(e) : c(e);
      }
      function a(t) {
        return 58 === t
          ? (e.consume(t), s)
          : (43 === t || 45 === t || 46 === t || Ue(t)) && r++ < 32
          ? (e.consume(t), a)
          : c(t);
      }
      function s(t) {
        return 62 === t
          ? (e.exit("autolinkProtocol"), p(t))
          : 32 === t || 60 === t || He(t)
          ? n(t)
          : (e.consume(t), s);
      }
      function c(t) {
        return 64 === t
          ? (e.consume(t), (r = 0), u)
          : je(t)
          ? (e.consume(t), c)
          : n(t);
      }
      function u(e) {
        return Ue(e) ? l(e) : n(e);
      }
      function l(t) {
        return 46 === t
          ? (e.consume(t), (r = 0), u)
          : 62 === t
          ? ((e.exit("autolinkProtocol").type = "autolinkEmail"), p(t))
          : f(t);
      }
      function f(t) {
        return (45 === t || Ue(t)) && r++ < 63
          ? (e.consume(t), 45 === t ? f : l)
          : n(t);
      }
      function p(n) {
        return (
          e.enter("autolinkMarker"),
          e.consume(n),
          e.exit("autolinkMarker"),
          e.exit("autolink"),
          t
        );
      }
    },
  },
  We = {
    name: "blockQuote",
    tokenize: function (e, t, n) {
      var r = this;
      return function (t) {
        if (62 === t)
          return (
            r.containerState.open ||
              (e.enter("blockQuote", { _container: !0 }),
              (r.containerState.open = !0)),
            e.enter("blockQuotePrefix"),
            e.enter("blockQuoteMarker"),
            e.consume(t),
            e.exit("blockQuoteMarker"),
            i
          );
        return n(t);
      };
      function i(n) {
        return Y(n)
          ? (e.enter("blockQuotePrefixWhitespace"),
            e.consume(n),
            e.exit("blockQuotePrefixWhitespace"),
            e.exit("blockQuotePrefix"),
            t)
          : (e.exit("blockQuotePrefix"), t(n));
      }
    },
    continuation: {
      tokenize: function (e, t, n) {
        return $(
          e,
          e.attempt(We, t, n),
          "linePrefix",
          this.parser.constructs.disable.null.indexOf("codeIndented") > -1
            ? void 0
            : 4
        );
      },
    },
    exit: function (e) {
      e.exit("blockQuote");
    },
  };
var Qe = We,
  Ye = Be(/[!-/:-@[-`{-~]/);
var $e = {
    name: "characterEscape",
    tokenize: function (e, t, n) {
      return function (t) {
        return (
          e.enter("characterEscape"),
          e.enter("escapeMarker"),
          e.consume(t),
          e.exit("escapeMarker"),
          r
        );
      };
      function r(r) {
        return Ye(r)
          ? (e.enter("characterEscapeValue"),
            e.consume(r),
            e.exit("characterEscapeValue"),
            e.exit("characterEscape"),
            t)
          : n(r);
      }
    },
  },
  Je = {
    AEli: "Æ",
    AElig: "Æ",
    AM: "&",
    AMP: "&",
    Aacut: "Á",
    Aacute: "Á",
    Abreve: "Ă",
    Acir: "Â",
    Acirc: "Â",
    Acy: "А",
    Afr: "𝔄",
    Agrav: "À",
    Agrave: "À",
    Alpha: "Α",
    Amacr: "Ā",
    And: "⩓",
    Aogon: "Ą",
    Aopf: "𝔸",
    ApplyFunction: "⁡",
    Arin: "Å",
    Aring: "Å",
    Ascr: "𝒜",
    Assign: "≔",
    Atild: "Ã",
    Atilde: "Ã",
    Aum: "Ä",
    Auml: "Ä",
    Backslash: "∖",
    Barv: "⫧",
    Barwed: "⌆",
    Bcy: "Б",
    Because: "∵",
    Bernoullis: "ℬ",
    Beta: "Β",
    Bfr: "𝔅",
    Bopf: "𝔹",
    Breve: "˘",
    Bscr: "ℬ",
    Bumpeq: "≎",
    CHcy: "Ч",
    COP: "©",
    COPY: "©",
    Cacute: "Ć",
    Cap: "⋒",
    CapitalDifferentialD: "ⅅ",
    Cayleys: "ℭ",
    Ccaron: "Č",
    Ccedi: "Ç",
    Ccedil: "Ç",
    Ccirc: "Ĉ",
    Cconint: "∰",
    Cdot: "Ċ",
    Cedilla: "¸",
    CenterDot: "·",
    Cfr: "ℭ",
    Chi: "Χ",
    CircleDot: "⊙",
    CircleMinus: "⊖",
    CirclePlus: "⊕",
    CircleTimes: "⊗",
    ClockwiseContourIntegral: "∲",
    CloseCurlyDoubleQuote: "”",
    CloseCurlyQuote: "’",
    Colon: "∷",
    Colone: "⩴",
    Congruent: "≡",
    Conint: "∯",
    ContourIntegral: "∮",
    Copf: "ℂ",
    Coproduct: "∐",
    CounterClockwiseContourIntegral: "∳",
    Cross: "⨯",
    Cscr: "𝒞",
    Cup: "⋓",
    CupCap: "≍",
    DD: "ⅅ",
    DDotrahd: "⤑",
    DJcy: "Ђ",
    DScy: "Ѕ",
    DZcy: "Џ",
    Dagger: "‡",
    Darr: "↡",
    Dashv: "⫤",
    Dcaron: "Ď",
    Dcy: "Д",
    Del: "∇",
    Delta: "Δ",
    Dfr: "𝔇",
    DiacriticalAcute: "´",
    DiacriticalDot: "˙",
    DiacriticalDoubleAcute: "˝",
    DiacriticalGrave: "`",
    DiacriticalTilde: "˜",
    Diamond: "⋄",
    DifferentialD: "ⅆ",
    Dopf: "𝔻",
    Dot: "¨",
    DotDot: "⃜",
    DotEqual: "≐",
    DoubleContourIntegral: "∯",
    DoubleDot: "¨",
    DoubleDownArrow: "⇓",
    DoubleLeftArrow: "⇐",
    DoubleLeftRightArrow: "⇔",
    DoubleLeftTee: "⫤",
    DoubleLongLeftArrow: "⟸",
    DoubleLongLeftRightArrow: "⟺",
    DoubleLongRightArrow: "⟹",
    DoubleRightArrow: "⇒",
    DoubleRightTee: "⊨",
    DoubleUpArrow: "⇑",
    DoubleUpDownArrow: "⇕",
    DoubleVerticalBar: "∥",
    DownArrow: "↓",
    DownArrowBar: "⤓",
    DownArrowUpArrow: "⇵",
    DownBreve: "̑",
    DownLeftRightVector: "⥐",
    DownLeftTeeVector: "⥞",
    DownLeftVector: "↽",
    DownLeftVectorBar: "⥖",
    DownRightTeeVector: "⥟",
    DownRightVector: "⇁",
    DownRightVectorBar: "⥗",
    DownTee: "⊤",
    DownTeeArrow: "↧",
    Downarrow: "⇓",
    Dscr: "𝒟",
    Dstrok: "Đ",
    ENG: "Ŋ",
    ET: "Ð",
    ETH: "Ð",
    Eacut: "É",
    Eacute: "É",
    Ecaron: "Ě",
    Ecir: "Ê",
    Ecirc: "Ê",
    Ecy: "Э",
    Edot: "Ė",
    Efr: "𝔈",
    Egrav: "È",
    Egrave: "È",
    Element: "∈",
    Emacr: "Ē",
    EmptySmallSquare: "◻",
    EmptyVerySmallSquare: "▫",
    Eogon: "Ę",
    Eopf: "𝔼",
    Epsilon: "Ε",
    Equal: "⩵",
    EqualTilde: "≂",
    Equilibrium: "⇌",
    Escr: "ℰ",
    Esim: "⩳",
    Eta: "Η",
    Eum: "Ë",
    Euml: "Ë",
    Exists: "∃",
    ExponentialE: "ⅇ",
    Fcy: "Ф",
    Ffr: "𝔉",
    FilledSmallSquare: "◼",
    FilledVerySmallSquare: "▪",
    Fopf: "𝔽",
    ForAll: "∀",
    Fouriertrf: "ℱ",
    Fscr: "ℱ",
    GJcy: "Ѓ",
    G: ">",
    GT: ">",
    Gamma: "Γ",
    Gammad: "Ϝ",
    Gbreve: "Ğ",
    Gcedil: "Ģ",
    Gcirc: "Ĝ",
    Gcy: "Г",
    Gdot: "Ġ",
    Gfr: "𝔊",
    Gg: "⋙",
    Gopf: "𝔾",
    GreaterEqual: "≥",
    GreaterEqualLess: "⋛",
    GreaterFullEqual: "≧",
    GreaterGreater: "⪢",
    GreaterLess: "≷",
    GreaterSlantEqual: "⩾",
    GreaterTilde: "≳",
    Gscr: "𝒢",
    Gt: "≫",
    HARDcy: "Ъ",
    Hacek: "ˇ",
    Hat: "^",
    Hcirc: "Ĥ",
    Hfr: "ℌ",
    HilbertSpace: "ℋ",
    Hopf: "ℍ",
    HorizontalLine: "─",
    Hscr: "ℋ",
    Hstrok: "Ħ",
    HumpDownHump: "≎",
    HumpEqual: "≏",
    IEcy: "Е",
    IJlig: "Ĳ",
    IOcy: "Ё",
    Iacut: "Í",
    Iacute: "Í",
    Icir: "Î",
    Icirc: "Î",
    Icy: "И",
    Idot: "İ",
    Ifr: "ℑ",
    Igrav: "Ì",
    Igrave: "Ì",
    Im: "ℑ",
    Imacr: "Ī",
    ImaginaryI: "ⅈ",
    Implies: "⇒",
    Int: "∬",
    Integral: "∫",
    Intersection: "⋂",
    InvisibleComma: "⁣",
    InvisibleTimes: "⁢",
    Iogon: "Į",
    Iopf: "𝕀",
    Iota: "Ι",
    Iscr: "ℐ",
    Itilde: "Ĩ",
    Iukcy: "І",
    Ium: "Ï",
    Iuml: "Ï",
    Jcirc: "Ĵ",
    Jcy: "Й",
    Jfr: "𝔍",
    Jopf: "𝕁",
    Jscr: "𝒥",
    Jsercy: "Ј",
    Jukcy: "Є",
    KHcy: "Х",
    KJcy: "Ќ",
    Kappa: "Κ",
    Kcedil: "Ķ",
    Kcy: "К",
    Kfr: "𝔎",
    Kopf: "𝕂",
    Kscr: "𝒦",
    LJcy: "Љ",
    L: "<",
    LT: "<",
    Lacute: "Ĺ",
    Lambda: "Λ",
    Lang: "⟪",
    Laplacetrf: "ℒ",
    Larr: "↞",
    Lcaron: "Ľ",
    Lcedil: "Ļ",
    Lcy: "Л",
    LeftAngleBracket: "⟨",
    LeftArrow: "←",
    LeftArrowBar: "⇤",
    LeftArrowRightArrow: "⇆",
    LeftCeiling: "⌈",
    LeftDoubleBracket: "⟦",
    LeftDownTeeVector: "⥡",
    LeftDownVector: "⇃",
    LeftDownVectorBar: "⥙",
    LeftFloor: "⌊",
    LeftRightArrow: "↔",
    LeftRightVector: "⥎",
    LeftTee: "⊣",
    LeftTeeArrow: "↤",
    LeftTeeVector: "⥚",
    LeftTriangle: "⊲",
    LeftTriangleBar: "⧏",
    LeftTriangleEqual: "⊴",
    LeftUpDownVector: "⥑",
    LeftUpTeeVector: "⥠",
    LeftUpVector: "↿",
    LeftUpVectorBar: "⥘",
    LeftVector: "↼",
    LeftVectorBar: "⥒",
    Leftarrow: "⇐",
    Leftrightarrow: "⇔",
    LessEqualGreater: "⋚",
    LessFullEqual: "≦",
    LessGreater: "≶",
    LessLess: "⪡",
    LessSlantEqual: "⩽",
    LessTilde: "≲",
    Lfr: "𝔏",
    Ll: "⋘",
    Lleftarrow: "⇚",
    Lmidot: "Ŀ",
    LongLeftArrow: "⟵",
    LongLeftRightArrow: "⟷",
    LongRightArrow: "⟶",
    Longleftarrow: "⟸",
    Longleftrightarrow: "⟺",
    Longrightarrow: "⟹",
    Lopf: "𝕃",
    LowerLeftArrow: "↙",
    LowerRightArrow: "↘",
    Lscr: "ℒ",
    Lsh: "↰",
    Lstrok: "Ł",
    Lt: "≪",
    Map: "⤅",
    Mcy: "М",
    MediumSpace: " ",
    Mellintrf: "ℳ",
    Mfr: "𝔐",
    MinusPlus: "∓",
    Mopf: "𝕄",
    Mscr: "ℳ",
    Mu: "Μ",
    NJcy: "Њ",
    Nacute: "Ń",
    Ncaron: "Ň",
    Ncedil: "Ņ",
    Ncy: "Н",
    NegativeMediumSpace: "​",
    NegativeThickSpace: "​",
    NegativeThinSpace: "​",
    NegativeVeryThinSpace: "​",
    NestedGreaterGreater: "≫",
    NestedLessLess: "≪",
    NewLine: "\n",
    Nfr: "𝔑",
    NoBreak: "⁠",
    NonBreakingSpace: " ",
    Nopf: "ℕ",
    Not: "⫬",
    NotCongruent: "≢",
    NotCupCap: "≭",
    NotDoubleVerticalBar: "∦",
    NotElement: "∉",
    NotEqual: "≠",
    NotEqualTilde: "≂̸",
    NotExists: "∄",
    NotGreater: "≯",
    NotGreaterEqual: "≱",
    NotGreaterFullEqual: "≧̸",
    NotGreaterGreater: "≫̸",
    NotGreaterLess: "≹",
    NotGreaterSlantEqual: "⩾̸",
    NotGreaterTilde: "≵",
    NotHumpDownHump: "≎̸",
    NotHumpEqual: "≏̸",
    NotLeftTriangle: "⋪",
    NotLeftTriangleBar: "⧏̸",
    NotLeftTriangleEqual: "⋬",
    NotLess: "≮",
    NotLessEqual: "≰",
    NotLessGreater: "≸",
    NotLessLess: "≪̸",
    NotLessSlantEqual: "⩽̸",
    NotLessTilde: "≴",
    NotNestedGreaterGreater: "⪢̸",
    NotNestedLessLess: "⪡̸",
    NotPrecedes: "⊀",
    NotPrecedesEqual: "⪯̸",
    NotPrecedesSlantEqual: "⋠",
    NotReverseElement: "∌",
    NotRightTriangle: "⋫",
    NotRightTriangleBar: "⧐̸",
    NotRightTriangleEqual: "⋭",
    NotSquareSubset: "⊏̸",
    NotSquareSubsetEqual: "⋢",
    NotSquareSuperset: "⊐̸",
    NotSquareSupersetEqual: "⋣",
    NotSubset: "⊂⃒",
    NotSubsetEqual: "⊈",
    NotSucceeds: "⊁",
    NotSucceedsEqual: "⪰̸",
    NotSucceedsSlantEqual: "⋡",
    NotSucceedsTilde: "≿̸",
    NotSuperset: "⊃⃒",
    NotSupersetEqual: "⊉",
    NotTilde: "≁",
    NotTildeEqual: "≄",
    NotTildeFullEqual: "≇",
    NotTildeTilde: "≉",
    NotVerticalBar: "∤",
    Nscr: "𝒩",
    Ntild: "Ñ",
    Ntilde: "Ñ",
    Nu: "Ν",
    OElig: "Œ",
    Oacut: "Ó",
    Oacute: "Ó",
    Ocir: "Ô",
    Ocirc: "Ô",
    Ocy: "О",
    Odblac: "Ő",
    Ofr: "𝔒",
    Ograv: "Ò",
    Ograve: "Ò",
    Omacr: "Ō",
    Omega: "Ω",
    Omicron: "Ο",
    Oopf: "𝕆",
    OpenCurlyDoubleQuote: "“",
    OpenCurlyQuote: "‘",
    Or: "⩔",
    Oscr: "𝒪",
    Oslas: "Ø",
    Oslash: "Ø",
    Otild: "Õ",
    Otilde: "Õ",
    Otimes: "⨷",
    Oum: "Ö",
    Ouml: "Ö",
    OverBar: "‾",
    OverBrace: "⏞",
    OverBracket: "⎴",
    OverParenthesis: "⏜",
    PartialD: "∂",
    Pcy: "П",
    Pfr: "𝔓",
    Phi: "Φ",
    Pi: "Π",
    PlusMinus: "±",
    Poincareplane: "ℌ",
    Popf: "ℙ",
    Pr: "⪻",
    Precedes: "≺",
    PrecedesEqual: "⪯",
    PrecedesSlantEqual: "≼",
    PrecedesTilde: "≾",
    Prime: "″",
    Product: "∏",
    Proportion: "∷",
    Proportional: "∝",
    Pscr: "𝒫",
    Psi: "Ψ",
    QUO: '"',
    QUOT: '"',
    Qfr: "𝔔",
    Qopf: "ℚ",
    Qscr: "𝒬",
    RBarr: "⤐",
    RE: "®",
    REG: "®",
    Racute: "Ŕ",
    Rang: "⟫",
    Rarr: "↠",
    Rarrtl: "⤖",
    Rcaron: "Ř",
    Rcedil: "Ŗ",
    Rcy: "Р",
    Re: "ℜ",
    ReverseElement: "∋",
    ReverseEquilibrium: "⇋",
    ReverseUpEquilibrium: "⥯",
    Rfr: "ℜ",
    Rho: "Ρ",
    RightAngleBracket: "⟩",
    RightArrow: "→",
    RightArrowBar: "⇥",
    RightArrowLeftArrow: "⇄",
    RightCeiling: "⌉",
    RightDoubleBracket: "⟧",
    RightDownTeeVector: "⥝",
    RightDownVector: "⇂",
    RightDownVectorBar: "⥕",
    RightFloor: "⌋",
    RightTee: "⊢",
    RightTeeArrow: "↦",
    RightTeeVector: "⥛",
    RightTriangle: "⊳",
    RightTriangleBar: "⧐",
    RightTriangleEqual: "⊵",
    RightUpDownVector: "⥏",
    RightUpTeeVector: "⥜",
    RightUpVector: "↾",
    RightUpVectorBar: "⥔",
    RightVector: "⇀",
    RightVectorBar: "⥓",
    Rightarrow: "⇒",
    Ropf: "ℝ",
    RoundImplies: "⥰",
    Rrightarrow: "⇛",
    Rscr: "ℛ",
    Rsh: "↱",
    RuleDelayed: "⧴",
    SHCHcy: "Щ",
    SHcy: "Ш",
    SOFTcy: "Ь",
    Sacute: "Ś",
    Sc: "⪼",
    Scaron: "Š",
    Scedil: "Ş",
    Scirc: "Ŝ",
    Scy: "С",
    Sfr: "𝔖",
    ShortDownArrow: "↓",
    ShortLeftArrow: "←",
    ShortRightArrow: "→",
    ShortUpArrow: "↑",
    Sigma: "Σ",
    SmallCircle: "∘",
    Sopf: "𝕊",
    Sqrt: "√",
    Square: "□",
    SquareIntersection: "⊓",
    SquareSubset: "⊏",
    SquareSubsetEqual: "⊑",
    SquareSuperset: "⊐",
    SquareSupersetEqual: "⊒",
    SquareUnion: "⊔",
    Sscr: "𝒮",
    Star: "⋆",
    Sub: "⋐",
    Subset: "⋐",
    SubsetEqual: "⊆",
    Succeeds: "≻",
    SucceedsEqual: "⪰",
    SucceedsSlantEqual: "≽",
    SucceedsTilde: "≿",
    SuchThat: "∋",
    Sum: "∑",
    Sup: "⋑",
    Superset: "⊃",
    SupersetEqual: "⊇",
    Supset: "⋑",
    THOR: "Þ",
    THORN: "Þ",
    TRADE: "™",
    TSHcy: "Ћ",
    TScy: "Ц",
    Tab: "\t",
    Tau: "Τ",
    Tcaron: "Ť",
    Tcedil: "Ţ",
    Tcy: "Т",
    Tfr: "𝔗",
    Therefore: "∴",
    Theta: "Θ",
    ThickSpace: "  ",
    ThinSpace: " ",
    Tilde: "∼",
    TildeEqual: "≃",
    TildeFullEqual: "≅",
    TildeTilde: "≈",
    Topf: "𝕋",
    TripleDot: "⃛",
    Tscr: "𝒯",
    Tstrok: "Ŧ",
    Uacut: "Ú",
    Uacute: "Ú",
    Uarr: "↟",
    Uarrocir: "⥉",
    Ubrcy: "Ў",
    Ubreve: "Ŭ",
    Ucir: "Û",
    Ucirc: "Û",
    Ucy: "У",
    Udblac: "Ű",
    Ufr: "𝔘",
    Ugrav: "Ù",
    Ugrave: "Ù",
    Umacr: "Ū",
    UnderBar: "_",
    UnderBrace: "⏟",
    UnderBracket: "⎵",
    UnderParenthesis: "⏝",
    Union: "⋃",
    UnionPlus: "⊎",
    Uogon: "Ų",
    Uopf: "𝕌",
    UpArrow: "↑",
    UpArrowBar: "⤒",
    UpArrowDownArrow: "⇅",
    UpDownArrow: "↕",
    UpEquilibrium: "⥮",
    UpTee: "⊥",
    UpTeeArrow: "↥",
    Uparrow: "⇑",
    Updownarrow: "⇕",
    UpperLeftArrow: "↖",
    UpperRightArrow: "↗",
    Upsi: "ϒ",
    Upsilon: "Υ",
    Uring: "Ů",
    Uscr: "𝒰",
    Utilde: "Ũ",
    Uum: "Ü",
    Uuml: "Ü",
    VDash: "⊫",
    Vbar: "⫫",
    Vcy: "В",
    Vdash: "⊩",
    Vdashl: "⫦",
    Vee: "⋁",
    Verbar: "‖",
    Vert: "‖",
    VerticalBar: "∣",
    VerticalLine: "|",
    VerticalSeparator: "❘",
    VerticalTilde: "≀",
    VeryThinSpace: " ",
    Vfr: "𝔙",
    Vopf: "𝕍",
    Vscr: "𝒱",
    Vvdash: "⊪",
    Wcirc: "Ŵ",
    Wedge: "⋀",
    Wfr: "𝔚",
    Wopf: "𝕎",
    Wscr: "𝒲",
    Xfr: "𝔛",
    Xi: "Ξ",
    Xopf: "𝕏",
    Xscr: "𝒳",
    YAcy: "Я",
    YIcy: "Ї",
    YUcy: "Ю",
    Yacut: "Ý",
    Yacute: "Ý",
    Ycirc: "Ŷ",
    Ycy: "Ы",
    Yfr: "𝔜",
    Yopf: "𝕐",
    Yscr: "𝒴",
    Yuml: "Ÿ",
    ZHcy: "Ж",
    Zacute: "Ź",
    Zcaron: "Ž",
    Zcy: "З",
    Zdot: "Ż",
    ZeroWidthSpace: "​",
    Zeta: "Ζ",
    Zfr: "ℨ",
    Zopf: "ℤ",
    Zscr: "𝒵",
    aacut: "á",
    aacute: "á",
    abreve: "ă",
    ac: "∾",
    acE: "∾̳",
    acd: "∿",
    acir: "â",
    acirc: "â",
    acut: "´",
    acute: "´",
    acy: "а",
    aeli: "æ",
    aelig: "æ",
    af: "⁡",
    afr: "𝔞",
    agrav: "à",
    agrave: "à",
    alefsym: "ℵ",
    aleph: "ℵ",
    alpha: "α",
    amacr: "ā",
    amalg: "⨿",
    am: "&",
    amp: "&",
    and: "∧",
    andand: "⩕",
    andd: "⩜",
    andslope: "⩘",
    andv: "⩚",
    ang: "∠",
    ange: "⦤",
    angle: "∠",
    angmsd: "∡",
    angmsdaa: "⦨",
    angmsdab: "⦩",
    angmsdac: "⦪",
    angmsdad: "⦫",
    angmsdae: "⦬",
    angmsdaf: "⦭",
    angmsdag: "⦮",
    angmsdah: "⦯",
    angrt: "∟",
    angrtvb: "⊾",
    angrtvbd: "⦝",
    angsph: "∢",
    angst: "Å",
    angzarr: "⍼",
    aogon: "ą",
    aopf: "𝕒",
    ap: "≈",
    apE: "⩰",
    apacir: "⩯",
    ape: "≊",
    apid: "≋",
    apos: "'",
    approx: "≈",
    approxeq: "≊",
    arin: "å",
    aring: "å",
    ascr: "𝒶",
    ast: "*",
    asymp: "≈",
    asympeq: "≍",
    atild: "ã",
    atilde: "ã",
    aum: "ä",
    auml: "ä",
    awconint: "∳",
    awint: "⨑",
    bNot: "⫭",
    backcong: "≌",
    backepsilon: "϶",
    backprime: "‵",
    backsim: "∽",
    backsimeq: "⋍",
    barvee: "⊽",
    barwed: "⌅",
    barwedge: "⌅",
    bbrk: "⎵",
    bbrktbrk: "⎶",
    bcong: "≌",
    bcy: "б",
    bdquo: "„",
    becaus: "∵",
    because: "∵",
    bemptyv: "⦰",
    bepsi: "϶",
    bernou: "ℬ",
    beta: "β",
    beth: "ℶ",
    between: "≬",
    bfr: "𝔟",
    bigcap: "⋂",
    bigcirc: "◯",
    bigcup: "⋃",
    bigodot: "⨀",
    bigoplus: "⨁",
    bigotimes: "⨂",
    bigsqcup: "⨆",
    bigstar: "★",
    bigtriangledown: "▽",
    bigtriangleup: "△",
    biguplus: "⨄",
    bigvee: "⋁",
    bigwedge: "⋀",
    bkarow: "⤍",
    blacklozenge: "⧫",
    blacksquare: "▪",
    blacktriangle: "▴",
    blacktriangledown: "▾",
    blacktriangleleft: "◂",
    blacktriangleright: "▸",
    blank: "␣",
    blk12: "▒",
    blk14: "░",
    blk34: "▓",
    block: "█",
    bne: "=⃥",
    bnequiv: "≡⃥",
    bnot: "⌐",
    bopf: "𝕓",
    bot: "⊥",
    bottom: "⊥",
    bowtie: "⋈",
    boxDL: "╗",
    boxDR: "╔",
    boxDl: "╖",
    boxDr: "╓",
    boxH: "═",
    boxHD: "╦",
    boxHU: "╩",
    boxHd: "╤",
    boxHu: "╧",
    boxUL: "╝",
    boxUR: "╚",
    boxUl: "╜",
    boxUr: "╙",
    boxV: "║",
    boxVH: "╬",
    boxVL: "╣",
    boxVR: "╠",
    boxVh: "╫",
    boxVl: "╢",
    boxVr: "╟",
    boxbox: "⧉",
    boxdL: "╕",
    boxdR: "╒",
    boxdl: "┐",
    boxdr: "┌",
    boxh: "─",
    boxhD: "╥",
    boxhU: "╨",
    boxhd: "┬",
    boxhu: "┴",
    boxminus: "⊟",
    boxplus: "⊞",
    boxtimes: "⊠",
    boxuL: "╛",
    boxuR: "╘",
    boxul: "┘",
    boxur: "└",
    boxv: "│",
    boxvH: "╪",
    boxvL: "╡",
    boxvR: "╞",
    boxvh: "┼",
    boxvl: "┤",
    boxvr: "├",
    bprime: "‵",
    breve: "˘",
    brvba: "¦",
    brvbar: "¦",
    bscr: "𝒷",
    bsemi: "⁏",
    bsim: "∽",
    bsime: "⋍",
    bsol: "\\",
    bsolb: "⧅",
    bsolhsub: "⟈",
    bull: "•",
    bullet: "•",
    bump: "≎",
    bumpE: "⪮",
    bumpe: "≏",
    bumpeq: "≏",
    cacute: "ć",
    cap: "∩",
    capand: "⩄",
    capbrcup: "⩉",
    capcap: "⩋",
    capcup: "⩇",
    capdot: "⩀",
    caps: "∩︀",
    caret: "⁁",
    caron: "ˇ",
    ccaps: "⩍",
    ccaron: "č",
    ccedi: "ç",
    ccedil: "ç",
    ccirc: "ĉ",
    ccups: "⩌",
    ccupssm: "⩐",
    cdot: "ċ",
    cedi: "¸",
    cedil: "¸",
    cemptyv: "⦲",
    cen: "¢",
    cent: "¢",
    centerdot: "·",
    cfr: "𝔠",
    chcy: "ч",
    check: "✓",
    checkmark: "✓",
    chi: "χ",
    cir: "○",
    cirE: "⧃",
    circ: "ˆ",
    circeq: "≗",
    circlearrowleft: "↺",
    circlearrowright: "↻",
    circledR: "®",
    circledS: "Ⓢ",
    circledast: "⊛",
    circledcirc: "⊚",
    circleddash: "⊝",
    cire: "≗",
    cirfnint: "⨐",
    cirmid: "⫯",
    cirscir: "⧂",
    clubs: "♣",
    clubsuit: "♣",
    colon: ":",
    colone: "≔",
    coloneq: "≔",
    comma: ",",
    commat: "@",
    comp: "∁",
    compfn: "∘",
    complement: "∁",
    complexes: "ℂ",
    cong: "≅",
    congdot: "⩭",
    conint: "∮",
    copf: "𝕔",
    coprod: "∐",
    cop: "©",
    copy: "©",
    copysr: "℗",
    crarr: "↵",
    cross: "✗",
    cscr: "𝒸",
    csub: "⫏",
    csube: "⫑",
    csup: "⫐",
    csupe: "⫒",
    ctdot: "⋯",
    cudarrl: "⤸",
    cudarrr: "⤵",
    cuepr: "⋞",
    cuesc: "⋟",
    cularr: "↶",
    cularrp: "⤽",
    cup: "∪",
    cupbrcap: "⩈",
    cupcap: "⩆",
    cupcup: "⩊",
    cupdot: "⊍",
    cupor: "⩅",
    cups: "∪︀",
    curarr: "↷",
    curarrm: "⤼",
    curlyeqprec: "⋞",
    curlyeqsucc: "⋟",
    curlyvee: "⋎",
    curlywedge: "⋏",
    curre: "¤",
    curren: "¤",
    curvearrowleft: "↶",
    curvearrowright: "↷",
    cuvee: "⋎",
    cuwed: "⋏",
    cwconint: "∲",
    cwint: "∱",
    cylcty: "⌭",
    dArr: "⇓",
    dHar: "⥥",
    dagger: "†",
    daleth: "ℸ",
    darr: "↓",
    dash: "‐",
    dashv: "⊣",
    dbkarow: "⤏",
    dblac: "˝",
    dcaron: "ď",
    dcy: "д",
    dd: "ⅆ",
    ddagger: "‡",
    ddarr: "⇊",
    ddotseq: "⩷",
    de: "°",
    deg: "°",
    delta: "δ",
    demptyv: "⦱",
    dfisht: "⥿",
    dfr: "𝔡",
    dharl: "⇃",
    dharr: "⇂",
    diam: "⋄",
    diamond: "⋄",
    diamondsuit: "♦",
    diams: "♦",
    die: "¨",
    digamma: "ϝ",
    disin: "⋲",
    div: "÷",
    divid: "÷",
    divide: "÷",
    divideontimes: "⋇",
    divonx: "⋇",
    djcy: "ђ",
    dlcorn: "⌞",
    dlcrop: "⌍",
    dollar: "$",
    dopf: "𝕕",
    dot: "˙",
    doteq: "≐",
    doteqdot: "≑",
    dotminus: "∸",
    dotplus: "∔",
    dotsquare: "⊡",
    doublebarwedge: "⌆",
    downarrow: "↓",
    downdownarrows: "⇊",
    downharpoonleft: "⇃",
    downharpoonright: "⇂",
    drbkarow: "⤐",
    drcorn: "⌟",
    drcrop: "⌌",
    dscr: "𝒹",
    dscy: "ѕ",
    dsol: "⧶",
    dstrok: "đ",
    dtdot: "⋱",
    dtri: "▿",
    dtrif: "▾",
    duarr: "⇵",
    duhar: "⥯",
    dwangle: "⦦",
    dzcy: "џ",
    dzigrarr: "⟿",
    eDDot: "⩷",
    eDot: "≑",
    eacut: "é",
    eacute: "é",
    easter: "⩮",
    ecaron: "ě",
    ecir: "ê",
    ecirc: "ê",
    ecolon: "≕",
    ecy: "э",
    edot: "ė",
    ee: "ⅇ",
    efDot: "≒",
    efr: "𝔢",
    eg: "⪚",
    egrav: "è",
    egrave: "è",
    egs: "⪖",
    egsdot: "⪘",
    el: "⪙",
    elinters: "⏧",
    ell: "ℓ",
    els: "⪕",
    elsdot: "⪗",
    emacr: "ē",
    empty: "∅",
    emptyset: "∅",
    emptyv: "∅",
    emsp13: " ",
    emsp14: " ",
    emsp: " ",
    eng: "ŋ",
    ensp: " ",
    eogon: "ę",
    eopf: "𝕖",
    epar: "⋕",
    eparsl: "⧣",
    eplus: "⩱",
    epsi: "ε",
    epsilon: "ε",
    epsiv: "ϵ",
    eqcirc: "≖",
    eqcolon: "≕",
    eqsim: "≂",
    eqslantgtr: "⪖",
    eqslantless: "⪕",
    equals: "=",
    equest: "≟",
    equiv: "≡",
    equivDD: "⩸",
    eqvparsl: "⧥",
    erDot: "≓",
    erarr: "⥱",
    escr: "ℯ",
    esdot: "≐",
    esim: "≂",
    eta: "η",
    et: "ð",
    eth: "ð",
    eum: "ë",
    euml: "ë",
    euro: "€",
    excl: "!",
    exist: "∃",
    expectation: "ℰ",
    exponentiale: "ⅇ",
    fallingdotseq: "≒",
    fcy: "ф",
    female: "♀",
    ffilig: "ﬃ",
    fflig: "ﬀ",
    ffllig: "ﬄ",
    ffr: "𝔣",
    filig: "ﬁ",
    fjlig: "fj",
    flat: "♭",
    fllig: "ﬂ",
    fltns: "▱",
    fnof: "ƒ",
    fopf: "𝕗",
    forall: "∀",
    fork: "⋔",
    forkv: "⫙",
    fpartint: "⨍",
    frac1: "¼",
    frac12: "½",
    frac13: "⅓",
    frac14: "¼",
    frac15: "⅕",
    frac16: "⅙",
    frac18: "⅛",
    frac23: "⅔",
    frac25: "⅖",
    frac3: "¾",
    frac34: "¾",
    frac35: "⅗",
    frac38: "⅜",
    frac45: "⅘",
    frac56: "⅚",
    frac58: "⅝",
    frac78: "⅞",
    frasl: "⁄",
    frown: "⌢",
    fscr: "𝒻",
    gE: "≧",
    gEl: "⪌",
    gacute: "ǵ",
    gamma: "γ",
    gammad: "ϝ",
    gap: "⪆",
    gbreve: "ğ",
    gcirc: "ĝ",
    gcy: "г",
    gdot: "ġ",
    ge: "≥",
    gel: "⋛",
    geq: "≥",
    geqq: "≧",
    geqslant: "⩾",
    ges: "⩾",
    gescc: "⪩",
    gesdot: "⪀",
    gesdoto: "⪂",
    gesdotol: "⪄",
    gesl: "⋛︀",
    gesles: "⪔",
    gfr: "𝔤",
    gg: "≫",
    ggg: "⋙",
    gimel: "ℷ",
    gjcy: "ѓ",
    gl: "≷",
    glE: "⪒",
    gla: "⪥",
    glj: "⪤",
    gnE: "≩",
    gnap: "⪊",
    gnapprox: "⪊",
    gne: "⪈",
    gneq: "⪈",
    gneqq: "≩",
    gnsim: "⋧",
    gopf: "𝕘",
    grave: "`",
    gscr: "ℊ",
    gsim: "≳",
    gsime: "⪎",
    gsiml: "⪐",
    g: ">",
    gt: ">",
    gtcc: "⪧",
    gtcir: "⩺",
    gtdot: "⋗",
    gtlPar: "⦕",
    gtquest: "⩼",
    gtrapprox: "⪆",
    gtrarr: "⥸",
    gtrdot: "⋗",
    gtreqless: "⋛",
    gtreqqless: "⪌",
    gtrless: "≷",
    gtrsim: "≳",
    gvertneqq: "≩︀",
    gvnE: "≩︀",
    hArr: "⇔",
    hairsp: " ",
    half: "½",
    hamilt: "ℋ",
    hardcy: "ъ",
    harr: "↔",
    harrcir: "⥈",
    harrw: "↭",
    hbar: "ℏ",
    hcirc: "ĥ",
    hearts: "♥",
    heartsuit: "♥",
    hellip: "…",
    hercon: "⊹",
    hfr: "𝔥",
    hksearow: "⤥",
    hkswarow: "⤦",
    hoarr: "⇿",
    homtht: "∻",
    hookleftarrow: "↩",
    hookrightarrow: "↪",
    hopf: "𝕙",
    horbar: "―",
    hscr: "𝒽",
    hslash: "ℏ",
    hstrok: "ħ",
    hybull: "⁃",
    hyphen: "‐",
    iacut: "í",
    iacute: "í",
    ic: "⁣",
    icir: "î",
    icirc: "î",
    icy: "и",
    iecy: "е",
    iexc: "¡",
    iexcl: "¡",
    iff: "⇔",
    ifr: "𝔦",
    igrav: "ì",
    igrave: "ì",
    ii: "ⅈ",
    iiiint: "⨌",
    iiint: "∭",
    iinfin: "⧜",
    iiota: "℩",
    ijlig: "ĳ",
    imacr: "ī",
    image: "ℑ",
    imagline: "ℐ",
    imagpart: "ℑ",
    imath: "ı",
    imof: "⊷",
    imped: "Ƶ",
    in: "∈",
    incare: "℅",
    infin: "∞",
    infintie: "⧝",
    inodot: "ı",
    int: "∫",
    intcal: "⊺",
    integers: "ℤ",
    intercal: "⊺",
    intlarhk: "⨗",
    intprod: "⨼",
    iocy: "ё",
    iogon: "į",
    iopf: "𝕚",
    iota: "ι",
    iprod: "⨼",
    iques: "¿",
    iquest: "¿",
    iscr: "𝒾",
    isin: "∈",
    isinE: "⋹",
    isindot: "⋵",
    isins: "⋴",
    isinsv: "⋳",
    isinv: "∈",
    it: "⁢",
    itilde: "ĩ",
    iukcy: "і",
    ium: "ï",
    iuml: "ï",
    jcirc: "ĵ",
    jcy: "й",
    jfr: "𝔧",
    jmath: "ȷ",
    jopf: "𝕛",
    jscr: "𝒿",
    jsercy: "ј",
    jukcy: "є",
    kappa: "κ",
    kappav: "ϰ",
    kcedil: "ķ",
    kcy: "к",
    kfr: "𝔨",
    kgreen: "ĸ",
    khcy: "х",
    kjcy: "ќ",
    kopf: "𝕜",
    kscr: "𝓀",
    lAarr: "⇚",
    lArr: "⇐",
    lAtail: "⤛",
    lBarr: "⤎",
    lE: "≦",
    lEg: "⪋",
    lHar: "⥢",
    lacute: "ĺ",
    laemptyv: "⦴",
    lagran: "ℒ",
    lambda: "λ",
    lang: "⟨",
    langd: "⦑",
    langle: "⟨",
    lap: "⪅",
    laqu: "«",
    laquo: "«",
    larr: "←",
    larrb: "⇤",
    larrbfs: "⤟",
    larrfs: "⤝",
    larrhk: "↩",
    larrlp: "↫",
    larrpl: "⤹",
    larrsim: "⥳",
    larrtl: "↢",
    lat: "⪫",
    latail: "⤙",
    late: "⪭",
    lates: "⪭︀",
    lbarr: "⤌",
    lbbrk: "❲",
    lbrace: "{",
    lbrack: "[",
    lbrke: "⦋",
    lbrksld: "⦏",
    lbrkslu: "⦍",
    lcaron: "ľ",
    lcedil: "ļ",
    lceil: "⌈",
    lcub: "{",
    lcy: "л",
    ldca: "⤶",
    ldquo: "“",
    ldquor: "„",
    ldrdhar: "⥧",
    ldrushar: "⥋",
    ldsh: "↲",
    le: "≤",
    leftarrow: "←",
    leftarrowtail: "↢",
    leftharpoondown: "↽",
    leftharpoonup: "↼",
    leftleftarrows: "⇇",
    leftrightarrow: "↔",
    leftrightarrows: "⇆",
    leftrightharpoons: "⇋",
    leftrightsquigarrow: "↭",
    leftthreetimes: "⋋",
    leg: "⋚",
    leq: "≤",
    leqq: "≦",
    leqslant: "⩽",
    les: "⩽",
    lescc: "⪨",
    lesdot: "⩿",
    lesdoto: "⪁",
    lesdotor: "⪃",
    lesg: "⋚︀",
    lesges: "⪓",
    lessapprox: "⪅",
    lessdot: "⋖",
    lesseqgtr: "⋚",
    lesseqqgtr: "⪋",
    lessgtr: "≶",
    lesssim: "≲",
    lfisht: "⥼",
    lfloor: "⌊",
    lfr: "𝔩",
    lg: "≶",
    lgE: "⪑",
    lhard: "↽",
    lharu: "↼",
    lharul: "⥪",
    lhblk: "▄",
    ljcy: "љ",
    ll: "≪",
    llarr: "⇇",
    llcorner: "⌞",
    llhard: "⥫",
    lltri: "◺",
    lmidot: "ŀ",
    lmoust: "⎰",
    lmoustache: "⎰",
    lnE: "≨",
    lnap: "⪉",
    lnapprox: "⪉",
    lne: "⪇",
    lneq: "⪇",
    lneqq: "≨",
    lnsim: "⋦",
    loang: "⟬",
    loarr: "⇽",
    lobrk: "⟦",
    longleftarrow: "⟵",
    longleftrightarrow: "⟷",
    longmapsto: "⟼",
    longrightarrow: "⟶",
    looparrowleft: "↫",
    looparrowright: "↬",
    lopar: "⦅",
    lopf: "𝕝",
    loplus: "⨭",
    lotimes: "⨴",
    lowast: "∗",
    lowbar: "_",
    loz: "◊",
    lozenge: "◊",
    lozf: "⧫",
    lpar: "(",
    lparlt: "⦓",
    lrarr: "⇆",
    lrcorner: "⌟",
    lrhar: "⇋",
    lrhard: "⥭",
    lrm: "‎",
    lrtri: "⊿",
    lsaquo: "‹",
    lscr: "𝓁",
    lsh: "↰",
    lsim: "≲",
    lsime: "⪍",
    lsimg: "⪏",
    lsqb: "[",
    lsquo: "‘",
    lsquor: "‚",
    lstrok: "ł",
    l: "<",
    lt: "<",
    ltcc: "⪦",
    ltcir: "⩹",
    ltdot: "⋖",
    lthree: "⋋",
    ltimes: "⋉",
    ltlarr: "⥶",
    ltquest: "⩻",
    ltrPar: "⦖",
    ltri: "◃",
    ltrie: "⊴",
    ltrif: "◂",
    lurdshar: "⥊",
    luruhar: "⥦",
    lvertneqq: "≨︀",
    lvnE: "≨︀",
    mDDot: "∺",
    mac: "¯",
    macr: "¯",
    male: "♂",
    malt: "✠",
    maltese: "✠",
    map: "↦",
    mapsto: "↦",
    mapstodown: "↧",
    mapstoleft: "↤",
    mapstoup: "↥",
    marker: "▮",
    mcomma: "⨩",
    mcy: "м",
    mdash: "—",
    measuredangle: "∡",
    mfr: "𝔪",
    mho: "℧",
    micr: "µ",
    micro: "µ",
    mid: "∣",
    midast: "*",
    midcir: "⫰",
    middo: "·",
    middot: "·",
    minus: "−",
    minusb: "⊟",
    minusd: "∸",
    minusdu: "⨪",
    mlcp: "⫛",
    mldr: "…",
    mnplus: "∓",
    models: "⊧",
    mopf: "𝕞",
    mp: "∓",
    mscr: "𝓂",
    mstpos: "∾",
    mu: "μ",
    multimap: "⊸",
    mumap: "⊸",
    nGg: "⋙̸",
    nGt: "≫⃒",
    nGtv: "≫̸",
    nLeftarrow: "⇍",
    nLeftrightarrow: "⇎",
    nLl: "⋘̸",
    nLt: "≪⃒",
    nLtv: "≪̸",
    nRightarrow: "⇏",
    nVDash: "⊯",
    nVdash: "⊮",
    nabla: "∇",
    nacute: "ń",
    nang: "∠⃒",
    nap: "≉",
    napE: "⩰̸",
    napid: "≋̸",
    napos: "ŉ",
    napprox: "≉",
    natur: "♮",
    natural: "♮",
    naturals: "ℕ",
    nbs: " ",
    nbsp: " ",
    nbump: "≎̸",
    nbumpe: "≏̸",
    ncap: "⩃",
    ncaron: "ň",
    ncedil: "ņ",
    ncong: "≇",
    ncongdot: "⩭̸",
    ncup: "⩂",
    ncy: "н",
    ndash: "–",
    ne: "≠",
    neArr: "⇗",
    nearhk: "⤤",
    nearr: "↗",
    nearrow: "↗",
    nedot: "≐̸",
    nequiv: "≢",
    nesear: "⤨",
    nesim: "≂̸",
    nexist: "∄",
    nexists: "∄",
    nfr: "𝔫",
    ngE: "≧̸",
    nge: "≱",
    ngeq: "≱",
    ngeqq: "≧̸",
    ngeqslant: "⩾̸",
    nges: "⩾̸",
    ngsim: "≵",
    ngt: "≯",
    ngtr: "≯",
    nhArr: "⇎",
    nharr: "↮",
    nhpar: "⫲",
    ni: "∋",
    nis: "⋼",
    nisd: "⋺",
    niv: "∋",
    njcy: "њ",
    nlArr: "⇍",
    nlE: "≦̸",
    nlarr: "↚",
    nldr: "‥",
    nle: "≰",
    nleftarrow: "↚",
    nleftrightarrow: "↮",
    nleq: "≰",
    nleqq: "≦̸",
    nleqslant: "⩽̸",
    nles: "⩽̸",
    nless: "≮",
    nlsim: "≴",
    nlt: "≮",
    nltri: "⋪",
    nltrie: "⋬",
    nmid: "∤",
    nopf: "𝕟",
    no: "¬",
    not: "¬",
    notin: "∉",
    notinE: "⋹̸",
    notindot: "⋵̸",
    notinva: "∉",
    notinvb: "⋷",
    notinvc: "⋶",
    notni: "∌",
    notniva: "∌",
    notnivb: "⋾",
    notnivc: "⋽",
    npar: "∦",
    nparallel: "∦",
    nparsl: "⫽⃥",
    npart: "∂̸",
    npolint: "⨔",
    npr: "⊀",
    nprcue: "⋠",
    npre: "⪯̸",
    nprec: "⊀",
    npreceq: "⪯̸",
    nrArr: "⇏",
    nrarr: "↛",
    nrarrc: "⤳̸",
    nrarrw: "↝̸",
    nrightarrow: "↛",
    nrtri: "⋫",
    nrtrie: "⋭",
    nsc: "⊁",
    nsccue: "⋡",
    nsce: "⪰̸",
    nscr: "𝓃",
    nshortmid: "∤",
    nshortparallel: "∦",
    nsim: "≁",
    nsime: "≄",
    nsimeq: "≄",
    nsmid: "∤",
    nspar: "∦",
    nsqsube: "⋢",
    nsqsupe: "⋣",
    nsub: "⊄",
    nsubE: "⫅̸",
    nsube: "⊈",
    nsubset: "⊂⃒",
    nsubseteq: "⊈",
    nsubseteqq: "⫅̸",
    nsucc: "⊁",
    nsucceq: "⪰̸",
    nsup: "⊅",
    nsupE: "⫆̸",
    nsupe: "⊉",
    nsupset: "⊃⃒",
    nsupseteq: "⊉",
    nsupseteqq: "⫆̸",
    ntgl: "≹",
    ntild: "ñ",
    ntilde: "ñ",
    ntlg: "≸",
    ntriangleleft: "⋪",
    ntrianglelefteq: "⋬",
    ntriangleright: "⋫",
    ntrianglerighteq: "⋭",
    nu: "ν",
    num: "#",
    numero: "№",
    numsp: " ",
    nvDash: "⊭",
    nvHarr: "⤄",
    nvap: "≍⃒",
    nvdash: "⊬",
    nvge: "≥⃒",
    nvgt: ">⃒",
    nvinfin: "⧞",
    nvlArr: "⤂",
    nvle: "≤⃒",
    nvlt: "<⃒",
    nvltrie: "⊴⃒",
    nvrArr: "⤃",
    nvrtrie: "⊵⃒",
    nvsim: "∼⃒",
    nwArr: "⇖",
    nwarhk: "⤣",
    nwarr: "↖",
    nwarrow: "↖",
    nwnear: "⤧",
    oS: "Ⓢ",
    oacut: "ó",
    oacute: "ó",
    oast: "⊛",
    ocir: "ô",
    ocirc: "ô",
    ocy: "о",
    odash: "⊝",
    odblac: "ő",
    odiv: "⨸",
    odot: "⊙",
    odsold: "⦼",
    oelig: "œ",
    ofcir: "⦿",
    ofr: "𝔬",
    ogon: "˛",
    ograv: "ò",
    ograve: "ò",
    ogt: "⧁",
    ohbar: "⦵",
    ohm: "Ω",
    oint: "∮",
    olarr: "↺",
    olcir: "⦾",
    olcross: "⦻",
    oline: "‾",
    olt: "⧀",
    omacr: "ō",
    omega: "ω",
    omicron: "ο",
    omid: "⦶",
    ominus: "⊖",
    oopf: "𝕠",
    opar: "⦷",
    operp: "⦹",
    oplus: "⊕",
    or: "∨",
    orarr: "↻",
    ord: "º",
    order: "ℴ",
    orderof: "ℴ",
    ordf: "ª",
    ordm: "º",
    origof: "⊶",
    oror: "⩖",
    orslope: "⩗",
    orv: "⩛",
    oscr: "ℴ",
    oslas: "ø",
    oslash: "ø",
    osol: "⊘",
    otild: "õ",
    otilde: "õ",
    otimes: "⊗",
    otimesas: "⨶",
    oum: "ö",
    ouml: "ö",
    ovbar: "⌽",
    par: "¶",
    para: "¶",
    parallel: "∥",
    parsim: "⫳",
    parsl: "⫽",
    part: "∂",
    pcy: "п",
    percnt: "%",
    period: ".",
    permil: "‰",
    perp: "⊥",
    pertenk: "‱",
    pfr: "𝔭",
    phi: "φ",
    phiv: "ϕ",
    phmmat: "ℳ",
    phone: "☎",
    pi: "π",
    pitchfork: "⋔",
    piv: "ϖ",
    planck: "ℏ",
    planckh: "ℎ",
    plankv: "ℏ",
    plus: "+",
    plusacir: "⨣",
    plusb: "⊞",
    pluscir: "⨢",
    plusdo: "∔",
    plusdu: "⨥",
    pluse: "⩲",
    plusm: "±",
    plusmn: "±",
    plussim: "⨦",
    plustwo: "⨧",
    pm: "±",
    pointint: "⨕",
    popf: "𝕡",
    poun: "£",
    pound: "£",
    pr: "≺",
    prE: "⪳",
    prap: "⪷",
    prcue: "≼",
    pre: "⪯",
    prec: "≺",
    precapprox: "⪷",
    preccurlyeq: "≼",
    preceq: "⪯",
    precnapprox: "⪹",
    precneqq: "⪵",
    precnsim: "⋨",
    precsim: "≾",
    prime: "′",
    primes: "ℙ",
    prnE: "⪵",
    prnap: "⪹",
    prnsim: "⋨",
    prod: "∏",
    profalar: "⌮",
    profline: "⌒",
    profsurf: "⌓",
    prop: "∝",
    propto: "∝",
    prsim: "≾",
    prurel: "⊰",
    pscr: "𝓅",
    psi: "ψ",
    puncsp: " ",
    qfr: "𝔮",
    qint: "⨌",
    qopf: "𝕢",
    qprime: "⁗",
    qscr: "𝓆",
    quaternions: "ℍ",
    quatint: "⨖",
    quest: "?",
    questeq: "≟",
    quo: '"',
    quot: '"',
    rAarr: "⇛",
    rArr: "⇒",
    rAtail: "⤜",
    rBarr: "⤏",
    rHar: "⥤",
    race: "∽̱",
    racute: "ŕ",
    radic: "√",
    raemptyv: "⦳",
    rang: "⟩",
    rangd: "⦒",
    range: "⦥",
    rangle: "⟩",
    raqu: "»",
    raquo: "»",
    rarr: "→",
    rarrap: "⥵",
    rarrb: "⇥",
    rarrbfs: "⤠",
    rarrc: "⤳",
    rarrfs: "⤞",
    rarrhk: "↪",
    rarrlp: "↬",
    rarrpl: "⥅",
    rarrsim: "⥴",
    rarrtl: "↣",
    rarrw: "↝",
    ratail: "⤚",
    ratio: "∶",
    rationals: "ℚ",
    rbarr: "⤍",
    rbbrk: "❳",
    rbrace: "}",
    rbrack: "]",
    rbrke: "⦌",
    rbrksld: "⦎",
    rbrkslu: "⦐",
    rcaron: "ř",
    rcedil: "ŗ",
    rceil: "⌉",
    rcub: "}",
    rcy: "р",
    rdca: "⤷",
    rdldhar: "⥩",
    rdquo: "”",
    rdquor: "”",
    rdsh: "↳",
    real: "ℜ",
    realine: "ℛ",
    realpart: "ℜ",
    reals: "ℝ",
    rect: "▭",
    re: "®",
    reg: "®",
    rfisht: "⥽",
    rfloor: "⌋",
    rfr: "𝔯",
    rhard: "⇁",
    rharu: "⇀",
    rharul: "⥬",
    rho: "ρ",
    rhov: "ϱ",
    rightarrow: "→",
    rightarrowtail: "↣",
    rightharpoondown: "⇁",
    rightharpoonup: "⇀",
    rightleftarrows: "⇄",
    rightleftharpoons: "⇌",
    rightrightarrows: "⇉",
    rightsquigarrow: "↝",
    rightthreetimes: "⋌",
    ring: "˚",
    risingdotseq: "≓",
    rlarr: "⇄",
    rlhar: "⇌",
    rlm: "‏",
    rmoust: "⎱",
    rmoustache: "⎱",
    rnmid: "⫮",
    roang: "⟭",
    roarr: "⇾",
    robrk: "⟧",
    ropar: "⦆",
    ropf: "𝕣",
    roplus: "⨮",
    rotimes: "⨵",
    rpar: ")",
    rpargt: "⦔",
    rppolint: "⨒",
    rrarr: "⇉",
    rsaquo: "›",
    rscr: "𝓇",
    rsh: "↱",
    rsqb: "]",
    rsquo: "’",
    rsquor: "’",
    rthree: "⋌",
    rtimes: "⋊",
    rtri: "▹",
    rtrie: "⊵",
    rtrif: "▸",
    rtriltri: "⧎",
    ruluhar: "⥨",
    rx: "℞",
    sacute: "ś",
    sbquo: "‚",
    sc: "≻",
    scE: "⪴",
    scap: "⪸",
    scaron: "š",
    sccue: "≽",
    sce: "⪰",
    scedil: "ş",
    scirc: "ŝ",
    scnE: "⪶",
    scnap: "⪺",
    scnsim: "⋩",
    scpolint: "⨓",
    scsim: "≿",
    scy: "с",
    sdot: "⋅",
    sdotb: "⊡",
    sdote: "⩦",
    seArr: "⇘",
    searhk: "⤥",
    searr: "↘",
    searrow: "↘",
    sec: "§",
    sect: "§",
    semi: ";",
    seswar: "⤩",
    setminus: "∖",
    setmn: "∖",
    sext: "✶",
    sfr: "𝔰",
    sfrown: "⌢",
    sharp: "♯",
    shchcy: "щ",
    shcy: "ш",
    shortmid: "∣",
    shortparallel: "∥",
    sh: "­",
    shy: "­",
    sigma: "σ",
    sigmaf: "ς",
    sigmav: "ς",
    sim: "∼",
    simdot: "⩪",
    sime: "≃",
    simeq: "≃",
    simg: "⪞",
    simgE: "⪠",
    siml: "⪝",
    simlE: "⪟",
    simne: "≆",
    simplus: "⨤",
    simrarr: "⥲",
    slarr: "←",
    smallsetminus: "∖",
    smashp: "⨳",
    smeparsl: "⧤",
    smid: "∣",
    smile: "⌣",
    smt: "⪪",
    smte: "⪬",
    smtes: "⪬︀",
    softcy: "ь",
    sol: "/",
    solb: "⧄",
    solbar: "⌿",
    sopf: "𝕤",
    spades: "♠",
    spadesuit: "♠",
    spar: "∥",
    sqcap: "⊓",
    sqcaps: "⊓︀",
    sqcup: "⊔",
    sqcups: "⊔︀",
    sqsub: "⊏",
    sqsube: "⊑",
    sqsubset: "⊏",
    sqsubseteq: "⊑",
    sqsup: "⊐",
    sqsupe: "⊒",
    sqsupset: "⊐",
    sqsupseteq: "⊒",
    squ: "□",
    square: "□",
    squarf: "▪",
    squf: "▪",
    srarr: "→",
    sscr: "𝓈",
    ssetmn: "∖",
    ssmile: "⌣",
    sstarf: "⋆",
    star: "☆",
    starf: "★",
    straightepsilon: "ϵ",
    straightphi: "ϕ",
    strns: "¯",
    sub: "⊂",
    subE: "⫅",
    subdot: "⪽",
    sube: "⊆",
    subedot: "⫃",
    submult: "⫁",
    subnE: "⫋",
    subne: "⊊",
    subplus: "⪿",
    subrarr: "⥹",
    subset: "⊂",
    subseteq: "⊆",
    subseteqq: "⫅",
    subsetneq: "⊊",
    subsetneqq: "⫋",
    subsim: "⫇",
    subsub: "⫕",
    subsup: "⫓",
    succ: "≻",
    succapprox: "⪸",
    succcurlyeq: "≽",
    succeq: "⪰",
    succnapprox: "⪺",
    succneqq: "⪶",
    succnsim: "⋩",
    succsim: "≿",
    sum: "∑",
    sung: "♪",
    sup: "⊃",
    sup1: "¹",
    sup2: "²",
    sup3: "³",
    supE: "⫆",
    supdot: "⪾",
    supdsub: "⫘",
    supe: "⊇",
    supedot: "⫄",
    suphsol: "⟉",
    suphsub: "⫗",
    suplarr: "⥻",
    supmult: "⫂",
    supnE: "⫌",
    supne: "⊋",
    supplus: "⫀",
    supset: "⊃",
    supseteq: "⊇",
    supseteqq: "⫆",
    supsetneq: "⊋",
    supsetneqq: "⫌",
    supsim: "⫈",
    supsub: "⫔",
    supsup: "⫖",
    swArr: "⇙",
    swarhk: "⤦",
    swarr: "↙",
    swarrow: "↙",
    swnwar: "⤪",
    szli: "ß",
    szlig: "ß",
    target: "⌖",
    tau: "τ",
    tbrk: "⎴",
    tcaron: "ť",
    tcedil: "ţ",
    tcy: "т",
    tdot: "⃛",
    telrec: "⌕",
    tfr: "𝔱",
    there4: "∴",
    therefore: "∴",
    theta: "θ",
    thetasym: "ϑ",
    thetav: "ϑ",
    thickapprox: "≈",
    thicksim: "∼",
    thinsp: " ",
    thkap: "≈",
    thksim: "∼",
    thor: "þ",
    thorn: "þ",
    tilde: "˜",
    time: "×",
    times: "×",
    timesb: "⊠",
    timesbar: "⨱",
    timesd: "⨰",
    tint: "∭",
    toea: "⤨",
    top: "⊤",
    topbot: "⌶",
    topcir: "⫱",
    topf: "𝕥",
    topfork: "⫚",
    tosa: "⤩",
    tprime: "‴",
    trade: "™",
    triangle: "▵",
    triangledown: "▿",
    triangleleft: "◃",
    trianglelefteq: "⊴",
    triangleq: "≜",
    triangleright: "▹",
    trianglerighteq: "⊵",
    tridot: "◬",
    trie: "≜",
    triminus: "⨺",
    triplus: "⨹",
    trisb: "⧍",
    tritime: "⨻",
    trpezium: "⏢",
    tscr: "𝓉",
    tscy: "ц",
    tshcy: "ћ",
    tstrok: "ŧ",
    twixt: "≬",
    twoheadleftarrow: "↞",
    twoheadrightarrow: "↠",
    uArr: "⇑",
    uHar: "⥣",
    uacut: "ú",
    uacute: "ú",
    uarr: "↑",
    ubrcy: "ў",
    ubreve: "ŭ",
    ucir: "û",
    ucirc: "û",
    ucy: "у",
    udarr: "⇅",
    udblac: "ű",
    udhar: "⥮",
    ufisht: "⥾",
    ufr: "𝔲",
    ugrav: "ù",
    ugrave: "ù",
    uharl: "↿",
    uharr: "↾",
    uhblk: "▀",
    ulcorn: "⌜",
    ulcorner: "⌜",
    ulcrop: "⌏",
    ultri: "◸",
    umacr: "ū",
    um: "¨",
    uml: "¨",
    uogon: "ų",
    uopf: "𝕦",
    uparrow: "↑",
    updownarrow: "↕",
    upharpoonleft: "↿",
    upharpoonright: "↾",
    uplus: "⊎",
    upsi: "υ",
    upsih: "ϒ",
    upsilon: "υ",
    upuparrows: "⇈",
    urcorn: "⌝",
    urcorner: "⌝",
    urcrop: "⌎",
    uring: "ů",
    urtri: "◹",
    uscr: "𝓊",
    utdot: "⋰",
    utilde: "ũ",
    utri: "▵",
    utrif: "▴",
    uuarr: "⇈",
    uum: "ü",
    uuml: "ü",
    uwangle: "⦧",
    vArr: "⇕",
    vBar: "⫨",
    vBarv: "⫩",
    vDash: "⊨",
    vangrt: "⦜",
    varepsilon: "ϵ",
    varkappa: "ϰ",
    varnothing: "∅",
    varphi: "ϕ",
    varpi: "ϖ",
    varpropto: "∝",
    varr: "↕",
    varrho: "ϱ",
    varsigma: "ς",
    varsubsetneq: "⊊︀",
    varsubsetneqq: "⫋︀",
    varsupsetneq: "⊋︀",
    varsupsetneqq: "⫌︀",
    vartheta: "ϑ",
    vartriangleleft: "⊲",
    vartriangleright: "⊳",
    vcy: "в",
    vdash: "⊢",
    vee: "∨",
    veebar: "⊻",
    veeeq: "≚",
    vellip: "⋮",
    verbar: "|",
    vert: "|",
    vfr: "𝔳",
    vltri: "⊲",
    vnsub: "⊂⃒",
    vnsup: "⊃⃒",
    vopf: "𝕧",
    vprop: "∝",
    vrtri: "⊳",
    vscr: "𝓋",
    vsubnE: "⫋︀",
    vsubne: "⊊︀",
    vsupnE: "⫌︀",
    vsupne: "⊋︀",
    vzigzag: "⦚",
    wcirc: "ŵ",
    wedbar: "⩟",
    wedge: "∧",
    wedgeq: "≙",
    weierp: "℘",
    wfr: "𝔴",
    wopf: "𝕨",
    wp: "℘",
    wr: "≀",
    wreath: "≀",
    wscr: "𝓌",
    xcap: "⋂",
    xcirc: "◯",
    xcup: "⋃",
    xdtri: "▽",
    xfr: "𝔵",
    xhArr: "⟺",
    xharr: "⟷",
    xi: "ξ",
    xlArr: "⟸",
    xlarr: "⟵",
    xmap: "⟼",
    xnis: "⋻",
    xodot: "⨀",
    xopf: "𝕩",
    xoplus: "⨁",
    xotime: "⨂",
    xrArr: "⟹",
    xrarr: "⟶",
    xscr: "𝓍",
    xsqcup: "⨆",
    xuplus: "⨄",
    xutri: "△",
    xvee: "⋁",
    xwedge: "⋀",
    yacut: "ý",
    yacute: "ý",
    yacy: "я",
    ycirc: "ŷ",
    ycy: "ы",
    ye: "¥",
    yen: "¥",
    yfr: "𝔶",
    yicy: "ї",
    yopf: "𝕪",
    yscr: "𝓎",
    yucy: "ю",
    yum: "ÿ",
    yuml: "ÿ",
    zacute: "ź",
    zcaron: "ž",
    zcy: "з",
    zdot: "ż",
    zeetrf: "ℨ",
    zeta: "ζ",
    zfr: "𝔷",
    zhcy: "ж",
    zigrarr: "⇝",
    zopf: "𝕫",
    zscr: "𝓏",
    zwj: "‍",
    zwnj: "‌",
  },
  Ze = function (e) {
    return !!Ke.call(Je, e) && Je[e];
  },
  Ke = {}.hasOwnProperty;
var Xe = Be(/\d/),
  et = Be(/[\dA-Fa-f]/);
function tt(e) {
  return e && "object" == typeof e && "default" in e ? e : { default: e };
}
var nt = tt(Ze),
  rt = {
    name: "characterReference",
    tokenize: function (e, t, n) {
      var r,
        i,
        o = this,
        a = 0;
      return function (t) {
        return (
          e.enter("characterReference"),
          e.enter("characterReferenceMarker"),
          e.consume(t),
          e.exit("characterReferenceMarker"),
          s
        );
      };
      function s(t) {
        return 35 === t
          ? (e.enter("characterReferenceMarkerNumeric"),
            e.consume(t),
            e.exit("characterReferenceMarkerNumeric"),
            c)
          : (e.enter("characterReferenceValue"), (r = 31), (i = Ue), u(t));
      }
      function c(t) {
        return 88 === t || 120 === t
          ? (e.enter("characterReferenceMarkerHexadecimal"),
            e.consume(t),
            e.exit("characterReferenceMarkerHexadecimal"),
            e.enter("characterReferenceValue"),
            (r = 6),
            (i = et),
            u)
          : (e.enter("characterReferenceValue"), (r = 7), (i = Xe), u(t));
      }
      function u(s) {
        var c;
        return 59 === s && a
          ? ((c = e.exit("characterReferenceValue")),
            i !== Ue || nt.default(o.sliceSerialize(c))
              ? (e.enter("characterReferenceMarker"),
                e.consume(s),
                e.exit("characterReferenceMarker"),
                e.exit("characterReference"),
                t)
              : n(s))
          : i(s) && a++ < r
          ? (e.consume(s), u)
          : n(s);
      }
    },
  };
var it = {
  name: "codeFenced",
  tokenize: function (e, t, n) {
    var r,
      i = this,
      o = {
        tokenize: function (e, t, n) {
          var i = 0;
          return $(
            e,
            o,
            "linePrefix",
            this.parser.constructs.disable.null.indexOf("codeIndented") > -1
              ? void 0
              : 4
          );
          function o(t) {
            return (
              e.enter("codeFencedFence"),
              e.enter("codeFencedFenceSequence"),
              a(t)
            );
          }
          function a(t) {
            return t === r
              ? (e.consume(t), i++, a)
              : i < s
              ? n(t)
              : (e.exit("codeFencedFenceSequence"), $(e, c, "whitespace")(t));
          }
          function c(r) {
            return null === r || Q(r)
              ? (e.exit("codeFencedFence"), t(r))
              : n(r);
          }
        },
        partial: !0,
      },
      a = oe(this.events, "linePrefix"),
      s = 0;
    return function (t) {
      return (
        e.enter("codeFenced"),
        e.enter("codeFencedFence"),
        e.enter("codeFencedFenceSequence"),
        (r = t),
        c(t)
      );
    };
    function c(t) {
      return t === r
        ? (e.consume(t), s++, c)
        : (e.exit("codeFencedFenceSequence"),
          s < 3 ? n(t) : $(e, u, "whitespace")(t));
    }
    function u(t) {
      return null === t || Q(t)
        ? d(t)
        : (e.enter("codeFencedFenceInfo"),
          e.enter("chunkString", { contentType: "string" }),
          l(t));
    }
    function l(t) {
      return null === t || Re(t)
        ? (e.exit("chunkString"),
          e.exit("codeFencedFenceInfo"),
          $(e, f, "whitespace")(t))
        : 96 === t && t === r
        ? n(t)
        : (e.consume(t), l);
    }
    function f(t) {
      return null === t || Q(t)
        ? d(t)
        : (e.enter("codeFencedFenceMeta"),
          e.enter("chunkString", { contentType: "string" }),
          p(t));
    }
    function p(t) {
      return null === t || Q(t)
        ? (e.exit("chunkString"), e.exit("codeFencedFenceMeta"), d(t))
        : 96 === t && t === r
        ? n(t)
        : (e.consume(t), p);
    }
    function d(n) {
      return e.exit("codeFencedFence"), i.interrupt ? t(n) : h(n);
    }
    function h(t) {
      return null === t
        ? m(t)
        : Q(t)
        ? (e.enter("lineEnding"),
          e.consume(t),
          e.exit("lineEnding"),
          e.attempt(o, m, a ? $(e, h, "linePrefix", a + 1) : h))
        : (e.enter("codeFlowValue"), g(t));
    }
    function g(t) {
      return null === t || Q(t)
        ? (e.exit("codeFlowValue"), h(t))
        : (e.consume(t), g);
    }
    function m(n) {
      return e.exit("codeFenced"), t(n);
    }
  },
  concrete: !0,
};
var ot = {
    name: "codeIndented",
    tokenize: function (e, t, n) {
      return e.attempt(at, r, n);
      function r(n) {
        return null === n
          ? t(n)
          : Q(n)
          ? e.attempt(at, r, t)(n)
          : (e.enter("codeFlowValue"), i(n));
      }
      function i(t) {
        return null === t || Q(t)
          ? (e.exit("codeFlowValue"), r(t))
          : (e.consume(t), i);
      }
    },
    resolve: function (e, t) {
      var n = {
        type: "codeIndented",
        start: e[0][1].start,
        end: e[e.length - 1][1].end,
      };
      return (
        se(e, 0, 0, [["enter", n, t]]), se(e, e.length, 0, [["exit", n, t]]), e
      );
    },
  },
  at = {
    tokenize: function (e, t, n) {
      var r = this;
      return $(
        e,
        function i(o) {
          if (Q(o))
            return (
              e.enter("lineEnding"),
              e.consume(o),
              e.exit("lineEnding"),
              $(e, i, "linePrefix", 5)
            );
          return oe(r.events, "linePrefix") < 4 ? n(o) : t(o);
        },
        "linePrefix",
        5
      );
    },
    partial: !0,
  };
var st = function (e, t, n, r, i, o, a, s, c) {
  var u = c || 1 / 0,
    l = 0;
  return function (t) {
    if (60 === t)
      return e.enter(r), e.enter(i), e.enter(o), e.consume(t), e.exit(o), f;
    if (He(t) || 41 === t) return n(t);
    return (
      e.enter(r),
      e.enter(a),
      e.enter(s),
      e.enter("chunkString", { contentType: "string" }),
      h(t)
    );
  };
  function f(n) {
    return 62 === n
      ? (e.enter(o), e.consume(n), e.exit(o), e.exit(i), e.exit(r), t)
      : (e.enter(s), e.enter("chunkString", { contentType: "string" }), p(n));
  }
  function p(t) {
    return 62 === t
      ? (e.exit("chunkString"), e.exit(s), f(t))
      : null === t || 60 === t || Q(t)
      ? n(t)
      : (e.consume(t), 92 === t ? d : p);
  }
  function d(t) {
    return 60 === t || 62 === t || 92 === t ? (e.consume(t), p) : p(t);
  }
  function h(i) {
    return 40 === i
      ? ++l > u
        ? n(i)
        : (e.consume(i), h)
      : 41 === i
      ? l--
        ? (e.consume(i), h)
        : (e.exit("chunkString"), e.exit(s), e.exit(a), e.exit(r), t(i))
      : null === i || Re(i)
      ? l
        ? n(i)
        : (e.exit("chunkString"), e.exit(s), e.exit(a), e.exit(r), t(i))
      : He(i)
      ? n(i)
      : (e.consume(i), 92 === i ? g : h);
  }
  function g(t) {
    return 40 === t || 41 === t || 92 === t ? (e.consume(t), h) : h(t);
  }
};
var ct = function (e, t, n, r, i, o) {
  var a,
    s = this,
    c = 0;
  return function (t) {
    return e.enter(r), e.enter(i), e.consume(t), e.exit(i), e.enter(o), u;
  };
  function u(f) {
    return null === f ||
      91 === f ||
      (93 === f && !a) ||
      (94 === f && !c && "_hiddenFootnoteSupport" in s.parser.constructs) ||
      c > 999
      ? n(f)
      : 93 === f
      ? (e.exit(o), e.enter(i), e.consume(f), e.exit(i), e.exit(r), t)
      : Q(f)
      ? (e.enter("lineEnding"), e.consume(f), e.exit("lineEnding"), u)
      : (e.enter("chunkString", { contentType: "string" }), l(f));
  }
  function l(t) {
    return null === t || 91 === t || 93 === t || Q(t) || c++ > 999
      ? (e.exit("chunkString"), u(t))
      : (e.consume(t), (a = a || !Y(t)), 92 === t ? f : l);
  }
  function f(t) {
    return 91 === t || 92 === t || 93 === t ? (e.consume(t), c++, l) : l(t);
  }
};
var ut = function (e, t) {
  var n;
  return function r(i) {
    if (Q(i))
      return (
        e.enter("lineEnding"), e.consume(i), e.exit("lineEnding"), (n = !0), r
      );
    if (Y(i)) return $(e, r, n ? "linePrefix" : "lineSuffix")(i);
    return t(i);
  };
};
var lt = function (e, t, n, r, i, o) {
    var a;
    return function (t) {
      return (
        e.enter(r),
        e.enter(i),
        e.consume(t),
        e.exit(i),
        (a = 40 === t ? 41 : t),
        s
      );
    };
    function s(n) {
      return n === a
        ? (e.enter(i), e.consume(n), e.exit(i), e.exit(r), t)
        : (e.enter(o), c(n));
    }
    function c(t) {
      return t === a
        ? (e.exit(o), s(a))
        : null === t
        ? n(t)
        : Q(t)
        ? (e.enter("lineEnding"),
          e.consume(t),
          e.exit("lineEnding"),
          $(e, c, "linePrefix"))
        : (e.enter("chunkString", { contentType: "string" }), u(t));
    }
    function u(t) {
      return t === a || null === t || Q(t)
        ? (e.exit("chunkString"), c(t))
        : (e.consume(t), 92 === t ? l : u);
    }
    function l(t) {
      return t === a || 92 === t ? (e.consume(t), u) : u(t);
    }
  },
  ft = {
    name: "definition",
    tokenize: function (e, t, n) {
      var r,
        i = this;
      return function (t) {
        return (
          e.enter("definition"),
          ct.call(
            i,
            e,
            o,
            n,
            "definitionLabel",
            "definitionLabelMarker",
            "definitionLabelString"
          )(t)
        );
      };
      function o(t) {
        return (
          (r = H(
            i.sliceSerialize(i.events[i.events.length - 1][1]).slice(1, -1)
          )),
          58 === t
            ? (e.enter("definitionMarker"),
              e.consume(t),
              e.exit("definitionMarker"),
              ut(
                e,
                st(
                  e,
                  e.attempt(pt, $(e, a, "whitespace"), $(e, a, "whitespace")),
                  n,
                  "definitionDestination",
                  "definitionDestinationLiteral",
                  "definitionDestinationLiteralMarker",
                  "definitionDestinationRaw",
                  "definitionDestinationString"
                )
              ))
            : n(t)
        );
      }
      function a(o) {
        return null === o || Q(o)
          ? (e.exit("definition"),
            i.parser.defined.indexOf(r) < 0 && i.parser.defined.push(r),
            t(o))
          : n(o);
      }
    },
  },
  pt = {
    tokenize: function (e, t, n) {
      return function (t) {
        return Re(t) ? ut(e, r)(t) : n(t);
      };
      function r(t) {
        return 34 === t || 39 === t || 40 === t
          ? lt(
              e,
              $(e, i, "whitespace"),
              n,
              "definitionTitle",
              "definitionTitleMarker",
              "definitionTitleString"
            )(t)
          : n(t);
      }
      function i(e) {
        return null === e || Q(e) ? t(e) : n(e);
      }
    },
    partial: !0,
  };
var dt = {
  name: "headingAtx",
  tokenize: function (e, t, n) {
    var r = this,
      i = 0;
    return function (t) {
      return e.enter("atxHeading"), e.enter("atxHeadingSequence"), o(t);
    };
    function o(s) {
      return 35 === s && i++ < 6
        ? (e.consume(s), o)
        : null === s || Re(s)
        ? (e.exit("atxHeadingSequence"), r.interrupt ? t(s) : a(s))
        : n(s);
    }
    function a(n) {
      return 35 === n
        ? (e.enter("atxHeadingSequence"), s(n))
        : null === n || Q(n)
        ? (e.exit("atxHeading"), t(n))
        : Y(n)
        ? $(e, a, "whitespace")(n)
        : (e.enter("atxHeadingText"), c(n));
    }
    function s(t) {
      return 35 === t
        ? (e.consume(t), s)
        : (e.exit("atxHeadingSequence"), a(t));
    }
    function c(t) {
      return null === t || 35 === t || Re(t)
        ? (e.exit("atxHeadingText"), a(t))
        : (e.consume(t), c);
    }
  },
  resolve: function (e, t) {
    var n,
      r,
      i = e.length - 2,
      o = 3;
    "whitespace" === e[o][1].type && (o += 2);
    i - 2 > o && "whitespace" === e[i][1].type && (i -= 2);
    "atxHeadingSequence" === e[i][1].type &&
      (o === i - 1 || (i - 4 > o && "whitespace" === e[i - 2][1].type)) &&
      (i -= o + 1 === i ? 2 : 4);
    i > o &&
      ((n = { type: "atxHeadingText", start: e[o][1].start, end: e[i][1].end }),
      (r = {
        type: "chunkText",
        start: e[o][1].start,
        end: e[i][1].end,
        contentType: "text",
      }),
      se(e, o, i - o + 1, [
        ["enter", n, t],
        ["enter", r, t],
        ["exit", r, t],
        ["exit", n, t],
      ]));
    return e;
  },
};
var ht = [
    "address",
    "article",
    "aside",
    "base",
    "basefont",
    "blockquote",
    "body",
    "caption",
    "center",
    "col",
    "colgroup",
    "dd",
    "details",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hr",
    "html",
    "iframe",
    "legend",
    "li",
    "link",
    "main",
    "menu",
    "menuitem",
    "nav",
    "noframes",
    "ol",
    "optgroup",
    "option",
    "p",
    "param",
    "section",
    "source",
    "summary",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "title",
    "tr",
    "track",
    "ul",
  ],
  gt = ["pre", "script", "style", "textarea"],
  mt = {
    name: "htmlFlow",
    tokenize: function (e, t, n) {
      var r,
        i,
        o,
        a,
        s,
        c = this;
      return function (t) {
        return e.enter("htmlFlow"), e.enter("htmlFlowData"), e.consume(t), u;
      };
      function u(a) {
        return 33 === a
          ? (e.consume(a), l)
          : 47 === a
          ? (e.consume(a), d)
          : 63 === a
          ? (e.consume(a), (r = 3), c.interrupt ? t : P)
          : Ve(a)
          ? (e.consume(a), (o = G(a)), (i = !0), h)
          : n(a);
      }
      function l(i) {
        return 45 === i
          ? (e.consume(i), (r = 2), f)
          : 91 === i
          ? (e.consume(i), (r = 5), (o = "CDATA["), (a = 0), p)
          : Ve(i)
          ? (e.consume(i), (r = 4), c.interrupt ? t : P)
          : n(i);
      }
      function f(r) {
        return 45 === r ? (e.consume(r), c.interrupt ? t : P) : n(r);
      }
      function p(r) {
        return r === o.charCodeAt(a++)
          ? (e.consume(r), a === o.length ? (c.interrupt ? t : C) : p)
          : n(r);
      }
      function d(t) {
        return Ve(t) ? (e.consume(t), (o = G(t)), h) : n(t);
      }
      function h(a) {
        return null === a || 47 === a || 62 === a || Re(a)
          ? 47 !== a && i && gt.indexOf(o.toLowerCase()) > -1
            ? ((r = 1), c.interrupt ? t(a) : C(a))
            : ht.indexOf(o.toLowerCase()) > -1
            ? ((r = 6),
              47 === a ? (e.consume(a), g) : c.interrupt ? t(a) : C(a))
            : ((r = 7), c.interrupt ? n(a) : i ? v(a) : m(a))
          : 45 === a || Ue(a)
          ? (e.consume(a), (o += G(a)), h)
          : n(a);
      }
      function g(r) {
        return 62 === r ? (e.consume(r), c.interrupt ? t : C) : n(r);
      }
      function m(t) {
        return Y(t) ? (e.consume(t), m) : S(t);
      }
      function v(t) {
        return 47 === t
          ? (e.consume(t), S)
          : 58 === t || 95 === t || Ve(t)
          ? (e.consume(t), y)
          : Y(t)
          ? (e.consume(t), v)
          : S(t);
      }
      function y(t) {
        return 45 === t || 46 === t || 58 === t || 95 === t || Ue(t)
          ? (e.consume(t), y)
          : x(t);
      }
      function x(t) {
        return 61 === t ? (e.consume(t), k) : Y(t) ? (e.consume(t), x) : v(t);
      }
      function k(t) {
        return null === t || 60 === t || 61 === t || 62 === t || 96 === t
          ? n(t)
          : 34 === t || 39 === t
          ? (e.consume(t), (s = t), b)
          : Y(t)
          ? (e.consume(t), k)
          : ((s = void 0), w(t));
      }
      function b(t) {
        return t === s
          ? (e.consume(t), E)
          : null === t || Q(t)
          ? n(t)
          : (e.consume(t), b);
      }
      function w(t) {
        return null === t ||
          34 === t ||
          39 === t ||
          60 === t ||
          61 === t ||
          62 === t ||
          96 === t ||
          Re(t)
          ? x(t)
          : (e.consume(t), w);
      }
      function E(e) {
        return 47 === e || 62 === e || Y(e) ? v(e) : n(e);
      }
      function S(t) {
        return 62 === t ? (e.consume(t), A) : n(t);
      }
      function A(t) {
        return Y(t) ? (e.consume(t), A) : null === t || Q(t) ? C(t) : n(t);
      }
      function C(t) {
        return 45 === t && 2 === r
          ? (e.consume(t), T)
          : 60 === t && 1 === r
          ? (e.consume(t), L)
          : 62 === t && 4 === r
          ? (e.consume(t), R)
          : 63 === t && 3 === r
          ? (e.consume(t), P)
          : 93 === t && 5 === r
          ? (e.consume(t), I)
          : !Q(t) || (6 !== r && 7 !== r)
          ? null === t || Q(t)
            ? q(t)
            : (e.consume(t), C)
          : e.check(vt, R, q)(t);
      }
      function q(t) {
        return e.exit("htmlFlowData"), D(t);
      }
      function D(t) {
        return null === t
          ? B(t)
          : Q(t)
          ? (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), D)
          : (e.enter("htmlFlowData"), C(t));
      }
      function T(t) {
        return 45 === t ? (e.consume(t), P) : C(t);
      }
      function L(t) {
        return 47 === t ? (e.consume(t), (o = ""), F) : C(t);
      }
      function F(t) {
        return 62 === t && gt.indexOf(o.toLowerCase()) > -1
          ? (e.consume(t), R)
          : Ve(t) && o.length < 8
          ? (e.consume(t), (o += G(t)), F)
          : C(t);
      }
      function I(t) {
        return 93 === t ? (e.consume(t), P) : C(t);
      }
      function P(t) {
        return 62 === t ? (e.consume(t), R) : C(t);
      }
      function R(t) {
        return null === t || Q(t)
          ? (e.exit("htmlFlowData"), B(t))
          : (e.consume(t), R);
      }
      function B(n) {
        return e.exit("htmlFlow"), t(n);
      }
    },
    resolveTo: function (e) {
      var t = e.length;
      for (; t-- && ("enter" !== e[t][0] || "htmlFlow" !== e[t][1].type); );
      t > 1 &&
        "linePrefix" === e[t - 2][1].type &&
        ((e[t][1].start = e[t - 2][1].start),
        (e[t + 1][1].start = e[t - 2][1].start),
        e.splice(t - 2, 2));
      return e;
    },
    concrete: !0,
  },
  vt = {
    tokenize: function (e, t, n) {
      return function (r) {
        return (
          e.exit("htmlFlowData"),
          e.enter("lineEndingBlank"),
          e.consume(r),
          e.exit("lineEndingBlank"),
          e.attempt(K, t, n)
        );
      };
    },
    partial: !0,
  };
var yt = {
    name: "labelEnd",
    tokenize: function (e, t, n) {
      var r,
        i,
        o = this,
        a = o.events.length;
      for (; a--; )
        if (
          ("labelImage" === o.events[a][1].type ||
            "labelLink" === o.events[a][1].type) &&
          !o.events[a][1]._balanced
        ) {
          r = o.events[a][1];
          break;
        }
      return function (t) {
        if (!r) return n(t);
        return r._inactive
          ? c(t)
          : ((i =
              o.parser.defined.indexOf(
                H(o.sliceSerialize({ start: r.end, end: o.now() }))
              ) > -1),
            e.enter("labelEnd"),
            e.enter("labelMarker"),
            e.consume(t),
            e.exit("labelMarker"),
            e.exit("labelEnd"),
            s);
      };
      function s(n) {
        return 40 === n
          ? e.attempt(xt, t, i ? t : c)(n)
          : 91 === n
          ? e.attempt(kt, t, i ? e.attempt(bt, t, c) : c)(n)
          : i
          ? t(n)
          : c(n);
      }
      function c(e) {
        return (r._balanced = !0), n(e);
      }
    },
    resolveTo: function (e, t) {
      var n,
        r,
        i,
        o,
        a,
        s,
        c,
        u = e.length,
        l = 0;
      for (; u--; )
        if (((o = e[u][1]), a)) {
          if ("link" === o.type || ("labelLink" === o.type && o._inactive))
            break;
          "enter" === e[u][0] && "labelLink" === o.type && (o._inactive = !0);
        } else if (s) {
          if (
            "enter" === e[u][0] &&
            ("labelImage" === o.type || "labelLink" === o.type) &&
            !o._balanced &&
            ((a = u), "labelLink" !== o.type)
          ) {
            l = 2;
            break;
          }
        } else "labelEnd" === o.type && (s = u);
      return (
        (n = {
          type: "labelLink" === e[a][1].type ? "link" : "image",
          start: ce(e[a][1].start),
          end: ce(e[e.length - 1][1].end),
        }),
        (r = { type: "label", start: ce(e[a][1].start), end: ce(e[s][1].end) }),
        (i = {
          type: "labelText",
          start: ce(e[a + l + 2][1].end),
          end: ce(e[s - 2][1].start),
        }),
        (c = Te(
          (c = [
            ["enter", n, t],
            ["enter", r, t],
          ]),
          e.slice(a + 1, a + l + 3)
        )),
        (c = Te(c, [["enter", i, t]])),
        (c = Te(
          c,
          Le(t.parser.constructs.insideSpan.null, e.slice(a + l + 4, s - 3), t)
        )),
        (c = Te(c, [["exit", i, t], e[s - 2], e[s - 1], ["exit", r, t]])),
        (c = Te(c, e.slice(s + 1))),
        (c = Te(c, [["exit", n, t]])),
        se(e, a, e.length, c),
        e
      );
    },
    resolveAll: function (e) {
      var t,
        n = -1;
      for (; ++n < e.length; )
        (t = e[n][1])._used ||
          ("labelImage" !== t.type &&
            "labelLink" !== t.type &&
            "labelEnd" !== t.type) ||
          (e.splice(n + 1, "labelImage" === t.type ? 4 : 2),
          (t.type = "data"),
          n++);
      return e;
    },
  },
  xt = {
    tokenize: function (e, t, n) {
      return function (t) {
        return (
          e.enter("resource"),
          e.enter("resourceMarker"),
          e.consume(t),
          e.exit("resourceMarker"),
          ut(e, r)
        );
      };
      function r(t) {
        return 41 === t
          ? a(t)
          : st(
              e,
              i,
              n,
              "resourceDestination",
              "resourceDestinationLiteral",
              "resourceDestinationLiteralMarker",
              "resourceDestinationRaw",
              "resourceDestinationString",
              3
            )(t);
      }
      function i(t) {
        return Re(t) ? ut(e, o)(t) : a(t);
      }
      function o(t) {
        return 34 === t || 39 === t || 40 === t
          ? lt(
              e,
              ut(e, a),
              n,
              "resourceTitle",
              "resourceTitleMarker",
              "resourceTitleString"
            )(t)
          : a(t);
      }
      function a(r) {
        return 41 === r
          ? (e.enter("resourceMarker"),
            e.consume(r),
            e.exit("resourceMarker"),
            e.exit("resource"),
            t)
          : n(r);
      }
    },
  },
  kt = {
    tokenize: function (e, t, n) {
      var r = this;
      return function (t) {
        return ct.call(
          r,
          e,
          i,
          n,
          "reference",
          "referenceMarker",
          "referenceString"
        )(t);
      };
      function i(e) {
        return r.parser.defined.indexOf(
          H(r.sliceSerialize(r.events[r.events.length - 1][1]).slice(1, -1))
        ) < 0
          ? n(e)
          : t(e);
      }
    },
  },
  bt = {
    tokenize: function (e, t, n) {
      return function (t) {
        return (
          e.enter("reference"),
          e.enter("referenceMarker"),
          e.consume(t),
          e.exit("referenceMarker"),
          r
        );
      };
      function r(r) {
        return 93 === r
          ? (e.enter("referenceMarker"),
            e.consume(r),
            e.exit("referenceMarker"),
            e.exit("reference"),
            t)
          : n(r);
      }
    },
  };
var wt = {
  name: "lineEnding",
  tokenize: function (e, t) {
    return function (n) {
      return (
        e.enter("lineEnding"),
        e.consume(n),
        e.exit("lineEnding"),
        $(e, t, "linePrefix")
      );
    };
  },
};
var Et = {
    name: "thematicBreak",
    tokenize: function (e, t, n) {
      var r,
        i = 0;
      return function (t) {
        return e.enter("thematicBreak"), (r = t), o(t);
      };
      function o(s) {
        return s === r
          ? (e.enter("thematicBreakSequence"), a(s))
          : Y(s)
          ? $(e, o, "whitespace")(s)
          : i < 3 || (null !== s && !Q(s))
          ? n(s)
          : (e.exit("thematicBreak"), t(s));
      }
      function a(t) {
        return t === r
          ? (e.consume(t), i++, a)
          : (e.exit("thematicBreakSequence"), o(t));
      }
    },
  },
  St = {
    name: "list",
    tokenize: function (e, t, n) {
      var r = this,
        i = oe(r.events, "linePrefix"),
        o = 0;
      return function (t) {
        var i =
          r.containerState.type ||
          (42 === t || 43 === t || 45 === t ? "listUnordered" : "listOrdered");
        if (
          "listUnordered" === i
            ? !r.containerState.marker || t === r.containerState.marker
            : Xe(t)
        ) {
          if (
            (r.containerState.type ||
              ((r.containerState.type = i), e.enter(i, { _container: !0 })),
            "listUnordered" === i)
          )
            return (
              e.enter("listItemPrefix"),
              42 === t || 45 === t ? e.check(Et, n, s)(t) : s(t)
            );
          if (!r.interrupt || 49 === t)
            return e.enter("listItemPrefix"), e.enter("listItemValue"), a(t);
        }
        return n(t);
      };
      function a(t) {
        return Xe(t) && ++o < 10
          ? (e.consume(t), a)
          : (!r.interrupt || o < 2) &&
            (r.containerState.marker
              ? t === r.containerState.marker
              : 41 === t || 46 === t)
          ? (e.exit("listItemValue"), s(t))
          : n(t);
      }
      function s(t) {
        return (
          e.enter("listItemMarker"),
          e.consume(t),
          e.exit("listItemMarker"),
          (r.containerState.marker = r.containerState.marker || t),
          e.check(K, r.interrupt ? n : c, e.attempt(At, l, u))
        );
      }
      function c(e) {
        return (r.containerState.initialBlankLine = !0), i++, l(e);
      }
      function u(t) {
        return Y(t)
          ? (e.enter("listItemPrefixWhitespace"),
            e.consume(t),
            e.exit("listItemPrefixWhitespace"),
            l)
          : n(t);
      }
      function l(n) {
        return (
          (r.containerState.size =
            i + ie(r.sliceStream(e.exit("listItemPrefix")))),
          t(n)
        );
      }
    },
    continuation: {
      tokenize: function (e, t, n) {
        var r = this;
        return (
          (r.containerState._closeFlow = void 0),
          e.check(
            K,
            function (n) {
              return (
                (r.containerState.furtherBlankLines =
                  r.containerState.furtherBlankLines ||
                  r.containerState.initialBlankLine),
                $(e, t, "listItemIndent", r.containerState.size + 1)(n)
              );
            },
            function (n) {
              if (r.containerState.furtherBlankLines || !Y(n))
                return (
                  (r.containerState.furtherBlankLines =
                    r.containerState.initialBlankLine =
                      void 0),
                  i(n)
                );
              return (
                (r.containerState.furtherBlankLines =
                  r.containerState.initialBlankLine =
                    void 0),
                e.attempt(Ct, t, i)(n)
              );
            }
          )
        );
        function i(i) {
          return (
            (r.containerState._closeFlow = !0),
            (r.interrupt = void 0),
            $(
              e,
              e.attempt(St, t, n),
              "linePrefix",
              r.parser.constructs.disable.null.indexOf("codeIndented") > -1
                ? void 0
                : 4
            )(i)
          );
        }
      },
    },
    exit: function (e) {
      e.exit(this.containerState.type);
    },
  },
  At = {
    tokenize: function (e, t, n) {
      var r = this;
      return $(
        e,
        function (e) {
          return Y(e) || !oe(r.events, "listItemPrefixWhitespace")
            ? n(e)
            : t(e);
        },
        "listItemPrefixWhitespace",
        r.parser.constructs.disable.null.indexOf("codeIndented") > -1
          ? void 0
          : 5
      );
    },
    partial: !0,
  },
  Ct = {
    tokenize: function (e, t, n) {
      var r = this;
      return $(
        e,
        function (e) {
          return oe(r.events, "listItemIndent") === r.containerState.size
            ? t(e)
            : n(e);
        },
        "listItemIndent",
        r.containerState.size + 1
      );
    },
    partial: !0,
  };
var qt = {
  name: "setextUnderline",
  tokenize: function (e, t, n) {
    var r,
      i,
      o = this,
      a = o.events.length;
    for (; a--; )
      if (
        "lineEnding" !== o.events[a][1].type &&
        "linePrefix" !== o.events[a][1].type &&
        "content" !== o.events[a][1].type
      ) {
        i = "paragraph" === o.events[a][1].type;
        break;
      }
    return function (t) {
      if (!o.lazy && (o.interrupt || i))
        return (
          e.enter("setextHeadingLine"),
          e.enter("setextHeadingLineSequence"),
          (r = t),
          s(t)
        );
      return n(t);
    };
    function s(t) {
      return t === r
        ? (e.consume(t), s)
        : (e.exit("setextHeadingLineSequence"), $(e, c, "lineSuffix")(t));
    }
    function c(r) {
      return null === r || Q(r) ? (e.exit("setextHeadingLine"), t(r)) : n(r);
    }
  },
  resolveTo: function (e, t) {
    var n,
      r,
      i,
      o,
      a = e.length;
    for (; a--; )
      if ("enter" === e[a][0]) {
        if ("content" === e[a][1].type) {
          n = a;
          break;
        }
        "paragraph" === e[a][1].type && (r = a);
      } else
        "content" === e[a][1].type && e.splice(a, 1),
          i || "definition" !== e[a][1].type || (i = a);
    (o = {
      type: "setextHeading",
      start: ce(e[r][1].start),
      end: ce(e[e.length - 1][1].end),
    }),
      (e[r][1].type = "setextHeadingText"),
      i
        ? (e.splice(r, 0, ["enter", o, t]),
          e.splice(i + 1, 0, ["exit", e[n][1], t]),
          (e[n][1].end = ce(e[i][1].end)))
        : (e[n][1] = o);
    return e.push(["exit", o, t]), e;
  },
};
var Dt = { 38: rt, 92: $e },
  Tt = {
    "-5": wt,
    "-4": wt,
    "-3": wt,
    33: {
      name: "labelStartImage",
      tokenize: function (e, t, n) {
        var r = this;
        return function (t) {
          return (
            e.enter("labelImage"),
            e.enter("labelImageMarker"),
            e.consume(t),
            e.exit("labelImageMarker"),
            i
          );
        };
        function i(t) {
          return 91 === t
            ? (e.enter("labelMarker"),
              e.consume(t),
              e.exit("labelMarker"),
              e.exit("labelImage"),
              o)
            : n(t);
        }
        function o(e) {
          return 94 === e && "_hiddenFootnoteSupport" in r.parser.constructs
            ? n(e)
            : t(e);
        }
      },
      resolveAll: yt.resolveAll,
    },
    38: rt,
    42: Ne,
    60: [
      Ge,
      {
        name: "htmlText",
        tokenize: function (e, t, n) {
          var r,
            i,
            o,
            a,
            s = this;
          return function (t) {
            return (
              e.enter("htmlText"), e.enter("htmlTextData"), e.consume(t), c
            );
          };
          function c(t) {
            return 33 === t
              ? (e.consume(t), u)
              : 47 === t
              ? (e.consume(t), w)
              : 63 === t
              ? (e.consume(t), k)
              : Ve(t)
              ? (e.consume(t), A)
              : n(t);
          }
          function u(t) {
            return 45 === t
              ? (e.consume(t), l)
              : 91 === t
              ? (e.consume(t), (i = "CDATA["), (o = 0), g)
              : Ve(t)
              ? (e.consume(t), x)
              : n(t);
          }
          function l(t) {
            return 45 === t ? (e.consume(t), f) : n(t);
          }
          function f(t) {
            return null === t || 62 === t
              ? n(t)
              : 45 === t
              ? (e.consume(t), p)
              : d(t);
          }
          function p(e) {
            return null === e || 62 === e ? n(e) : d(e);
          }
          function d(t) {
            return null === t
              ? n(t)
              : 45 === t
              ? (e.consume(t), h)
              : Q(t)
              ? ((a = d), P(t))
              : (e.consume(t), d);
          }
          function h(t) {
            return 45 === t ? (e.consume(t), B) : d(t);
          }
          function g(t) {
            return t === i.charCodeAt(o++)
              ? (e.consume(t), o === i.length ? m : g)
              : n(t);
          }
          function m(t) {
            return null === t
              ? n(t)
              : 93 === t
              ? (e.consume(t), v)
              : Q(t)
              ? ((a = m), P(t))
              : (e.consume(t), m);
          }
          function v(t) {
            return 93 === t ? (e.consume(t), y) : m(t);
          }
          function y(t) {
            return 62 === t ? B(t) : 93 === t ? (e.consume(t), y) : m(t);
          }
          function x(t) {
            return null === t || 62 === t
              ? B(t)
              : Q(t)
              ? ((a = x), P(t))
              : (e.consume(t), x);
          }
          function k(t) {
            return null === t
              ? n(t)
              : 63 === t
              ? (e.consume(t), b)
              : Q(t)
              ? ((a = k), P(t))
              : (e.consume(t), k);
          }
          function b(e) {
            return 62 === e ? B(e) : k(e);
          }
          function w(t) {
            return Ve(t) ? (e.consume(t), E) : n(t);
          }
          function E(t) {
            return 45 === t || Ue(t) ? (e.consume(t), E) : S(t);
          }
          function S(t) {
            return Q(t) ? ((a = S), P(t)) : Y(t) ? (e.consume(t), S) : B(t);
          }
          function A(t) {
            return 45 === t || Ue(t)
              ? (e.consume(t), A)
              : 47 === t || 62 === t || Re(t)
              ? C(t)
              : n(t);
          }
          function C(t) {
            return 47 === t
              ? (e.consume(t), B)
              : 58 === t || 95 === t || Ve(t)
              ? (e.consume(t), q)
              : Q(t)
              ? ((a = C), P(t))
              : Y(t)
              ? (e.consume(t), C)
              : B(t);
          }
          function q(t) {
            return 45 === t || 46 === t || 58 === t || 95 === t || Ue(t)
              ? (e.consume(t), q)
              : D(t);
          }
          function D(t) {
            return 61 === t
              ? (e.consume(t), T)
              : Q(t)
              ? ((a = D), P(t))
              : Y(t)
              ? (e.consume(t), D)
              : C(t);
          }
          function T(t) {
            return null === t || 60 === t || 61 === t || 62 === t || 96 === t
              ? n(t)
              : 34 === t || 39 === t
              ? (e.consume(t), (r = t), L)
              : Q(t)
              ? ((a = T), P(t))
              : Y(t)
              ? (e.consume(t), T)
              : (e.consume(t), (r = void 0), I);
          }
          function L(t) {
            return t === r
              ? (e.consume(t), F)
              : null === t
              ? n(t)
              : Q(t)
              ? ((a = L), P(t))
              : (e.consume(t), L);
          }
          function F(e) {
            return 62 === e || 47 === e || Re(e) ? C(e) : n(e);
          }
          function I(t) {
            return null === t ||
              34 === t ||
              39 === t ||
              60 === t ||
              61 === t ||
              96 === t
              ? n(t)
              : 62 === t || Re(t)
              ? C(t)
              : (e.consume(t), I);
          }
          function P(t) {
            return (
              e.exit("htmlTextData"),
              e.enter("lineEnding"),
              e.consume(t),
              e.exit("lineEnding"),
              $(
                e,
                R,
                "linePrefix",
                s.parser.constructs.disable.null.indexOf("codeIndented") > -1
                  ? void 0
                  : 4
              )
            );
          }
          function R(t) {
            return e.enter("htmlTextData"), a(t);
          }
          function B(r) {
            return 62 === r
              ? (e.consume(r), e.exit("htmlTextData"), e.exit("htmlText"), t)
              : n(r);
          }
        },
      },
    ],
    91: {
      name: "labelStartLink",
      tokenize: function (e, t, n) {
        var r = this;
        return function (t) {
          return (
            e.enter("labelLink"),
            e.enter("labelMarker"),
            e.consume(t),
            e.exit("labelMarker"),
            e.exit("labelLink"),
            i
          );
        };
        function i(e) {
          return 94 === e && "_hiddenFootnoteSupport" in r.parser.constructs
            ? n(e)
            : t(e);
        }
      },
      resolveAll: yt.resolveAll,
    },
    92: [
      {
        name: "hardBreakEscape",
        tokenize: function (e, t, n) {
          return function (t) {
            return (
              e.enter("hardBreakEscape"),
              e.enter("escapeMarker"),
              e.consume(t),
              r
            );
          };
          function r(r) {
            return Q(r)
              ? (e.exit("escapeMarker"), e.exit("hardBreakEscape"), t(r))
              : n(r);
          }
        },
      },
      $e,
    ],
    93: yt,
    95: Ne,
    96: {
      name: "codeText",
      tokenize: function (e, t, n) {
        var r,
          i,
          o = 0;
        return function (t) {
          return e.enter("codeText"), e.enter("codeTextSequence"), a(t);
        };
        function a(t) {
          return 96 === t
            ? (e.consume(t), o++, a)
            : (e.exit("codeTextSequence"), s(t));
        }
        function s(t) {
          return null === t
            ? n(t)
            : 96 === t
            ? ((i = e.enter("codeTextSequence")), (r = 0), u(t))
            : 32 === t
            ? (e.enter("space"), e.consume(t), e.exit("space"), s)
            : Q(t)
            ? (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), s)
            : (e.enter("codeTextData"), c(t));
        }
        function c(t) {
          return null === t || 32 === t || 96 === t || Q(t)
            ? (e.exit("codeTextData"), s(t))
            : (e.consume(t), c);
        }
        function u(n) {
          return 96 === n
            ? (e.consume(n), r++, u)
            : r === o
            ? (e.exit("codeTextSequence"), e.exit("codeText"), t(n))
            : ((i.type = "codeTextData"), c(n));
        }
      },
      resolve: function (e) {
        var t,
          n,
          r = e.length - 4,
          i = 3;
        if (
          !(
            ("lineEnding" !== e[i][1].type && "space" !== e[i][1].type) ||
            ("lineEnding" !== e[r][1].type && "space" !== e[r][1].type)
          )
        )
          for (t = i; ++t < r; )
            if ("codeTextData" === e[t][1].type) {
              (e[r][1].type = e[i][1].type = "codeTextPadding"),
                (i += 2),
                (r -= 2);
              break;
            }
        (t = i - 1), r++;
        for (; ++t <= r; )
          void 0 === n
            ? t !== r && "lineEnding" !== e[t][1].type && (n = t)
            : (t !== r && "lineEnding" !== e[t][1].type) ||
              ((e[n][1].type = "codeTextData"),
              t !== n + 2 &&
                ((e[n][1].end = e[t - 1][1].end),
                e.splice(n + 2, t - n - 2),
                (r -= t - n - 2),
                (t = n + 2)),
              (n = void 0));
        return e;
      },
      previous: function (e) {
        return (
          96 !== e ||
          "characterEscape" === this.events[this.events.length - 1][1].type
        );
      },
    },
  },
  Lt = { 91: ft },
  Ft = { null: [] },
  It = {
    42: St,
    43: St,
    45: St,
    48: St,
    49: St,
    50: St,
    51: St,
    52: St,
    53: St,
    54: St,
    55: St,
    56: St,
    57: St,
    62: Qe,
  },
  Pt = {
    35: dt,
    42: Et,
    45: [qt, Et],
    60: mt,
    61: qt,
    95: Et,
    96: it,
    126: it,
  },
  Rt = { "-2": ot, "-1": ot, 32: ot },
  Bt = { null: [Ne, Se.resolver] },
  Ot = Dt,
  zt = Tt,
  _t = Object.defineProperty(
    {
      contentInitial: Lt,
      disable: Ft,
      document: It,
      flow: Pt,
      flowInitial: Rt,
      insideSpan: Bt,
      string: Ot,
      text: zt,
    },
    "__esModule",
    { value: !0 }
  );
var Mt = function (e) {
    var t = {
      defined: [],
      constructs: De([_t].concat(Ae((e || {}).extensions))),
      content: n(Z),
      document: n(re),
      flow: n(ge),
      string: n(Se.string),
      text: n(Se.text),
    };
    return t;
    function n(e) {
      return function (n) {
        return Pe(t, e, n);
      };
    }
  },
  Nt = /[\0\t\n\r]/g;
var Vt = function () {
  var e,
    t = !0,
    n = 1,
    r = "";
  return function (i, o, a) {
    var s,
      c,
      u,
      l,
      f,
      p = [];
    (i = r + i.toString(o)),
      (u = 0),
      (r = ""),
      t && (65279 === i.charCodeAt(0) && u++, (t = void 0));
    for (; u < i.length; ) {
      if (
        ((Nt.lastIndex = u),
        (s = Nt.exec(i)),
        (l = s ? s.index : i.length),
        (f = i.charCodeAt(l)),
        !s)
      ) {
        r = i.slice(u);
        break;
      }
      if (10 === f && u === l && e) p.push(-3), (e = void 0);
      else if (
        (e && (p.push(-5), (e = void 0)),
        u < l && (p.push(i.slice(u, l)), (n += l - u)),
        0 === f)
      )
        p.push(65533), n++;
      else if (9 === f)
        for (c = 4 * Math.ceil(n / 4), p.push(-2); n++ < c; ) p.push(-1);
      else 10 === f ? (p.push(-4), (n = 1)) : ((e = !0), (n = 1));
      u = l + 1;
    }
    a && (e && p.push(-5), r && p.push(r), p.push(null));
    return p;
  };
};
var Ut = function (e) {
    for (; !le(e); );
    return e;
  },
  jt = {}.hasOwnProperty,
  Ht = function (e) {
    if (!e || "object" != typeof e) return "";
    if (jt.call(e, "position") || jt.call(e, "type")) return Wt(e.position);
    if (jt.call(e, "start") || jt.call(e, "end")) return Wt(e);
    if (jt.call(e, "line") || jt.call(e, "column")) return Gt(e);
    return "";
  };
function Gt(e) {
  return (
    (e && "object" == typeof e) || (e = {}), Qt(e.line) + ":" + Qt(e.column)
  );
}
function Wt(e) {
  return (e && "object" == typeof e) || (e = {}), Gt(e.start) + "-" + Gt(e.end);
}
function Qt(e) {
  return e && "number" == typeof e ? e : 1;
}
function Yt(e, t) {
  var n, r;
  for (n in t)
    (r = j.call(e, n) ? e[n] : (e[n] = {})),
      "canContainEols" === n || "transforms" === n
        ? (e[n] = [].concat(r, t[n]))
        : Object.assign(r, t[n]);
}
var $t = function (e, t, n) {
    "string" != typeof t && ((n = t), (t = void 0));
    return (function (e) {
      var t = e || {},
        n = (function (e, t) {
          var n = -1;
          for (; ++n < t.length; ) Yt(e, t[n]);
          return e;
        })(
          {
            transforms: [],
            canContainEols: [
              "emphasis",
              "fragment",
              "heading",
              "paragraph",
              "strong",
            ],
            enter: {
              autolink: u(ue),
              autolinkProtocol: T,
              autolinkEmail: T,
              atxHeading: u(oe),
              blockQuote: u(ee),
              characterEscape: T,
              characterReference: T,
              codeFenced: u(te),
              codeFencedFenceInfo: l,
              codeFencedFenceMeta: l,
              codeIndented: u(te, l),
              codeText: u(ne, l),
              codeTextData: T,
              data: T,
              codeFlowValue: T,
              definition: u(re),
              definitionDestinationString: l,
              definitionLabelString: l,
              definitionTitleString: l,
              emphasis: u(ie),
              hardBreakEscape: u(ae),
              hardBreakTrailing: u(ae),
              htmlFlow: u(se, l),
              htmlFlowData: T,
              htmlText: u(se, l),
              htmlTextData: T,
              image: u(ce),
              label: l,
              link: u(ue),
              listItem: u(fe),
              listItemValue: m,
              listOrdered: u(le, g),
              listUnordered: u(le),
              paragraph: u(pe),
              reference: Y,
              referenceString: l,
              resourceDestinationString: l,
              resourceTitleString: l,
              setextHeading: u(oe),
              strong: u(de),
              thematicBreak: u(ge),
            },
            exit: {
              atxHeading: p(),
              atxHeadingSequence: A,
              autolink: p(),
              autolinkEmail: X,
              autolinkProtocol: K,
              blockQuote: p(),
              characterEscapeValue: L,
              characterReferenceMarkerHexadecimal: J,
              characterReferenceMarkerNumeric: J,
              characterReferenceValue: Z,
              codeFenced: p(k),
              codeFencedFence: x,
              codeFencedFenceInfo: v,
              codeFencedFenceMeta: y,
              codeFlowValue: L,
              codeIndented: p(b),
              codeText: p(B),
              codeTextData: L,
              data: L,
              definition: p(),
              definitionDestinationString: S,
              definitionLabelString: w,
              definitionTitleString: E,
              emphasis: p(),
              hardBreakEscape: p(I),
              hardBreakTrailing: p(I),
              htmlFlow: p(P),
              htmlFlowData: L,
              htmlText: p(R),
              htmlTextData: L,
              image: p(z),
              label: N,
              labelText: _,
              lineEnding: F,
              link: p(O),
              listItem: p(),
              listOrdered: p(),
              listUnordered: p(),
              paragraph: p(),
              referenceString: $,
              resourceDestinationString: V,
              resourceTitleString: G,
              resource: Q,
              setextHeading: p(D),
              setextHeadingLineSequence: q,
              setextHeadingText: C,
              strong: p(),
              thematicBreak: p(),
            },
          },
          t.mdastExtensions || []
        ),
        r = {};
      return i;
      function i(e) {
        for (
          var t,
            r = { type: "root", children: [] },
            i = [],
            u = [],
            p = -1,
            g = {
              stack: [r],
              tokenStack: i,
              config: n,
              enter: f,
              exit: d,
              buffer: l,
              resume: h,
              setData: a,
              getData: s,
            };
          ++p < e.length;

        )
          ("listOrdered" !== e[p][1].type &&
            "listUnordered" !== e[p][1].type) ||
            ("enter" === e[p][0] ? u.push(p) : (p = o(e, u.pop(p), p)));
        for (p = -1; ++p < e.length; )
          (t = n[e[p][0]]),
            j.call(t, e[p][1].type) &&
              t[e[p][1].type].call(
                U({ sliceSerialize: e[p][2].sliceSerialize }, g),
                e[p][1]
              );
        if (i.length)
          throw new Error(
            "Cannot close document, a token (`" +
              i[i.length - 1].type +
              "`, " +
              Ht({ start: i[i.length - 1].start, end: i[i.length - 1].end }) +
              ") is still open"
          );
        for (
          r.position = {
            start: c(
              e.length ? e[0][1].start : { line: 1, column: 1, offset: 0 }
            ),
            end: c(
              e.length
                ? e[e.length - 2][1].end
                : { line: 1, column: 1, offset: 0 }
            ),
          },
            p = -1;
          ++p < n.transforms.length;

        )
          r = n.transforms[p](r) || r;
        return r;
      }
      function o(e, t, n) {
        for (var r, i, o, a, s, u, l, f = t - 1, p = -1, d = !1; ++f <= n; )
          if (
            ("listUnordered" === (s = e[f])[1].type ||
            "listOrdered" === s[1].type ||
            "blockQuote" === s[1].type
              ? ("enter" === s[0] ? p++ : p--, (l = void 0))
              : "lineEndingBlank" === s[1].type
              ? "enter" === s[0] && (!r || l || p || u || (u = f), (l = void 0))
              : "linePrefix" === s[1].type ||
                "listItemValue" === s[1].type ||
                "listItemMarker" === s[1].type ||
                "listItemPrefix" === s[1].type ||
                "listItemPrefixWhitespace" === s[1].type ||
                (l = void 0),
            (!p && "enter" === s[0] && "listItemPrefix" === s[1].type) ||
              (-1 === p &&
                "exit" === s[0] &&
                ("listUnordered" === s[1].type || "listOrdered" === s[1].type)))
          ) {
            if (r) {
              for (i = f, o = void 0; i--; )
                if (
                  "lineEnding" === (a = e[i])[1].type ||
                  "lineEndingBlank" === a[1].type
                ) {
                  if ("exit" === a[0]) continue;
                  o && ((e[o][1].type = "lineEndingBlank"), (d = !0)),
                    (a[1].type = "lineEnding"),
                    (o = i);
                } else if (
                  "linePrefix" !== a[1].type &&
                  "blockQuotePrefix" !== a[1].type &&
                  "blockQuotePrefixWhitespace" !== a[1].type &&
                  "blockQuoteMarker" !== a[1].type &&
                  "listItemIndent" !== a[1].type
                )
                  break;
              u && (!o || u < o) && (r._spread = !0),
                (r.end = c(o ? e[o][1].start : s[1].end)),
                e.splice(o || f, 0, ["exit", r, s[2]]),
                f++,
                n++;
            }
            "listItemPrefix" === s[1].type &&
              ((r = { type: "listItem", _spread: !1, start: c(s[1].start) }),
              e.splice(f, 0, ["enter", r, s[2]]),
              f++,
              n++,
              (u = void 0),
              (l = !0));
          }
        return (e[t][1]._spread = d), n;
      }
      function a(e, t) {
        r[e] = t;
      }
      function s(e) {
        return r[e];
      }
      function c(e) {
        return { line: e.line, column: e.column, offset: e.offset };
      }
      function u(e, t) {
        return n;
        function n(n) {
          f.call(this, e(n), n), t && t.call(this, n);
        }
      }
      function l() {
        this.stack.push({ type: "fragment", children: [] });
      }
      function f(e, t) {
        return (
          this.stack[this.stack.length - 1].children.push(e),
          this.stack.push(e),
          this.tokenStack.push(t),
          (e.position = { start: c(t.start) }),
          e
        );
      }
      function p(e) {
        return t;
        function t(t) {
          e && e.call(this, t), d.call(this, t);
        }
      }
      function d(e) {
        var t = this.stack.pop(),
          n = this.tokenStack.pop();
        if (!n)
          throw new Error(
            "Cannot close `" +
              e.type +
              "` (" +
              Ht({ start: e.start, end: e.end }) +
              "): it’s not open"
          );
        if (n.type !== e.type)
          throw new Error(
            "Cannot close `" +
              e.type +
              "` (" +
              Ht({ start: e.start, end: e.end }) +
              "): a different token (`" +
              n.type +
              "`, " +
              Ht({ start: n.start, end: n.end }) +
              ") is open"
          );
        return (t.position.end = c(e.end)), t;
      }
      function h() {
        return M(this.stack.pop());
      }
      function g() {
        a("expectingFirstListItemValue", !0);
      }
      function m(e) {
        s("expectingFirstListItemValue") &&
          ((this.stack[this.stack.length - 2].start = parseInt(
            this.sliceSerialize(e),
            10
          )),
          a("expectingFirstListItemValue"));
      }
      function v() {
        var e = this.resume();
        this.stack[this.stack.length - 1].lang = e;
      }
      function y() {
        var e = this.resume();
        this.stack[this.stack.length - 1].meta = e;
      }
      function x() {
        s("flowCodeInside") || (this.buffer(), a("flowCodeInside", !0));
      }
      function k() {
        var e = this.resume();
        (this.stack[this.stack.length - 1].value = e.replace(
          /^(\r?\n|\r)|(\r?\n|\r)$/g,
          ""
        )),
          a("flowCodeInside");
      }
      function b() {
        var e = this.resume();
        this.stack[this.stack.length - 1].value = e;
      }
      function w(e) {
        var t = this.resume();
        (this.stack[this.stack.length - 1].label = t),
          (this.stack[this.stack.length - 1].identifier = H(
            this.sliceSerialize(e)
          ).toLowerCase());
      }
      function E() {
        var e = this.resume();
        this.stack[this.stack.length - 1].title = e;
      }
      function S() {
        var e = this.resume();
        this.stack[this.stack.length - 1].url = e;
      }
      function A(e) {
        this.stack[this.stack.length - 1].depth ||
          (this.stack[this.stack.length - 1].depth =
            this.sliceSerialize(e).length);
      }
      function C() {
        a("setextHeadingSlurpLineEnding", !0);
      }
      function q(e) {
        this.stack[this.stack.length - 1].depth =
          61 === this.sliceSerialize(e).charCodeAt(0) ? 1 : 2;
      }
      function D() {
        a("setextHeadingSlurpLineEnding");
      }
      function T(e) {
        var t = this.stack[this.stack.length - 1].children,
          n = t[t.length - 1];
        (n && "text" === n.type) ||
          (((n = he()).position = { start: c(e.start) }),
          this.stack[this.stack.length - 1].children.push(n)),
          this.stack.push(n);
      }
      function L(e) {
        var t = this.stack.pop();
        (t.value += this.sliceSerialize(e)), (t.position.end = c(e.end));
      }
      function F(e) {
        var t = this.stack[this.stack.length - 1];
        if (s("atHardBreak"))
          return (
            (t.children[t.children.length - 1].position.end = c(e.end)),
            void a("atHardBreak")
          );
        !s("setextHeadingSlurpLineEnding") &&
          n.canContainEols.indexOf(t.type) > -1 &&
          (T.call(this, e), L.call(this, e));
      }
      function I() {
        a("atHardBreak", !0);
      }
      function P() {
        var e = this.resume();
        this.stack[this.stack.length - 1].value = e;
      }
      function R() {
        var e = this.resume();
        this.stack[this.stack.length - 1].value = e;
      }
      function B() {
        var e = this.resume();
        this.stack[this.stack.length - 1].value = e;
      }
      function O() {
        var e = this.stack[this.stack.length - 1];
        s("inReference")
          ? ((e.type += "Reference"),
            (e.referenceType = s("referenceType") || "shortcut"),
            delete e.url,
            delete e.title)
          : (delete e.identifier, delete e.label, delete e.referenceType),
          a("referenceType");
      }
      function z() {
        var e = this.stack[this.stack.length - 1];
        s("inReference")
          ? ((e.type += "Reference"),
            (e.referenceType = s("referenceType") || "shortcut"),
            delete e.url,
            delete e.title)
          : (delete e.identifier, delete e.label, delete e.referenceType),
          a("referenceType");
      }
      function _(e) {
        this.stack[this.stack.length - 2].identifier = H(
          this.sliceSerialize(e)
        ).toLowerCase();
      }
      function N() {
        var e = this.stack[this.stack.length - 1],
          t = this.resume();
        (this.stack[this.stack.length - 1].label = t),
          a("inReference", !0),
          "link" === this.stack[this.stack.length - 1].type
            ? (this.stack[this.stack.length - 1].children = e.children)
            : (this.stack[this.stack.length - 1].alt = t);
      }
      function V() {
        var e = this.resume();
        this.stack[this.stack.length - 1].url = e;
      }
      function G() {
        var e = this.resume();
        this.stack[this.stack.length - 1].title = e;
      }
      function Q() {
        a("inReference");
      }
      function Y() {
        a("referenceType", "collapsed");
      }
      function $(e) {
        var t = this.resume();
        (this.stack[this.stack.length - 1].label = t),
          (this.stack[this.stack.length - 1].identifier = H(
            this.sliceSerialize(e)
          ).toLowerCase()),
          a("referenceType", "full");
      }
      function J(e) {
        a("characterReferenceType", e.type);
      }
      function Z(e) {
        var t,
          n,
          r = this.sliceSerialize(e),
          i = s("characterReferenceType");
        i
          ? ((t = W(r, "characterReferenceMarkerNumeric" === i ? 10 : 16)),
            a("characterReferenceType"))
          : (t = Ze(r)),
          ((n = this.stack.pop()).value += t),
          (n.position.end = c(e.end));
      }
      function K(e) {
        L.call(this, e),
          (this.stack[this.stack.length - 1].url = this.sliceSerialize(e));
      }
      function X(e) {
        L.call(this, e),
          (this.stack[this.stack.length - 1].url =
            "mailto:" + this.sliceSerialize(e));
      }
      function ee() {
        return { type: "blockquote", children: [] };
      }
      function te() {
        return { type: "code", lang: null, meta: null, value: "" };
      }
      function ne() {
        return { type: "inlineCode", value: "" };
      }
      function re() {
        return {
          type: "definition",
          identifier: "",
          label: null,
          title: null,
          url: "",
        };
      }
      function ie() {
        return { type: "emphasis", children: [] };
      }
      function oe() {
        return { type: "heading", depth: void 0, children: [] };
      }
      function ae() {
        return { type: "break" };
      }
      function se() {
        return { type: "html", value: "" };
      }
      function ce() {
        return { type: "image", title: null, url: "", alt: null };
      }
      function ue() {
        return { type: "link", title: null, url: "", children: [] };
      }
      function le(e) {
        return {
          type: "list",
          ordered: "listOrdered" === e.type,
          start: null,
          spread: e._spread,
          children: [],
        };
      }
      function fe(e) {
        return {
          type: "listItem",
          spread: e._spread,
          checked: null,
          children: [],
        };
      }
      function pe() {
        return { type: "paragraph", children: [] };
      }
      function de() {
        return { type: "strong", children: [] };
      }
      function he() {
        return { type: "text", value: "" };
      }
      function ge() {
        return { type: "thematicBreak" };
      }
    })(n)(Ut(Mt(n).document().write(Vt()(e, t, !0))));
  },
  Jt = function (e) {
    var t = this;
    this.Parser = function (n) {
      return $t(
        n,
        Object.assign({}, t.data("settings"), e, {
          extensions: t.data("micromarkExtensions") || [],
          mdastExtensions: t.data("fromMarkdownExtensions") || [],
        })
      );
    };
  };
var Zt = function (e) {
  if (e) throw e;
};
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */ var Kt = function (e) {
    return (
      null != e &&
      null != e.constructor &&
      "function" == typeof e.constructor.isBuffer &&
      e.constructor.isBuffer(e)
    );
  },
  Xt = Object.prototype.hasOwnProperty,
  en = Object.prototype.toString,
  tn = Object.defineProperty,
  nn = Object.getOwnPropertyDescriptor,
  rn = function (e) {
    return "function" == typeof Array.isArray
      ? Array.isArray(e)
      : "[object Array]" === en.call(e);
  },
  on = function (e) {
    if (!e || "[object Object]" !== en.call(e)) return !1;
    var t,
      n = Xt.call(e, "constructor"),
      r =
        e.constructor &&
        e.constructor.prototype &&
        Xt.call(e.constructor.prototype, "isPrototypeOf");
    if (e.constructor && !n && !r) return !1;
    for (t in e);
    return void 0 === t || Xt.call(e, t);
  },
  an = function (e, t) {
    tn && "__proto__" === t.name
      ? tn(e, t.name, {
          enumerable: !0,
          configurable: !0,
          value: t.newValue,
          writable: !0,
        })
      : (e[t.name] = t.newValue);
  },
  sn = function (e, t) {
    if ("__proto__" === t) {
      if (!Xt.call(e, t)) return;
      if (nn) return nn(e, t).value;
    }
    return e[t];
  },
  cn = function e() {
    var t,
      n,
      r,
      i,
      o,
      a,
      s = arguments[0],
      c = 1,
      u = arguments.length,
      l = !1;
    for (
      "boolean" == typeof s && ((l = s), (s = arguments[1] || {}), (c = 2)),
        (null == s || ("object" != typeof s && "function" != typeof s)) &&
          (s = {});
      c < u;
      ++c
    )
      if (null != (t = arguments[c]))
        for (n in t)
          (r = sn(s, n)),
            s !== (i = sn(t, n)) &&
              (l && i && (on(i) || (o = rn(i)))
                ? (o
                    ? ((o = !1), (a = r && rn(r) ? r : []))
                    : (a = r && on(r) ? r : {}),
                  an(s, { name: n, newValue: e(l, a, i) }))
                : void 0 !== i && an(s, { name: n, newValue: i }));
    return s;
  },
  un = e => {
    if ("[object Object]" !== Object.prototype.toString.call(e)) return !1;
    const t = Object.getPrototypeOf(e);
    return null === t || t === Object.prototype;
  },
  ln = [].slice,
  fn = function (e, t) {
    var n;
    return function () {
      var t,
        o = ln.call(arguments, 0),
        a = e.length > o.length;
      a && o.push(r);
      try {
        t = e.apply(null, o);
      } catch (e) {
        if (a && n) throw e;
        return r(e);
      }
      a ||
        (t && "function" == typeof t.then
          ? t.then(i, r)
          : t instanceof Error
          ? r(t)
          : i(t));
    };
    function r() {
      n || ((n = !0), t.apply(null, arguments));
    }
    function i(e) {
      r(null, e);
    }
  };
var pn = hn;
hn.wrap = fn;
var dn = [].slice;
function hn() {
  var e = [],
    t = {
      run: function () {
        var t = -1,
          n = dn.call(arguments, 0, -1),
          r = arguments[arguments.length - 1];
        if ("function" != typeof r)
          throw new Error("Expected function as last argument, not " + r);
        function i(o) {
          var a = e[++t],
            s = dn.call(arguments, 0),
            c = s.slice(1),
            u = n.length,
            l = -1;
          if (o) r(o);
          else {
            for (; ++l < u; )
              (null !== c[l] && void 0 !== c[l]) || (c[l] = n[l]);
            (n = c),
              a ? fn(a, i).apply(null, n) : r.apply(null, [null].concat(n));
          }
        }
        i.apply(null, [null].concat(n));
      },
      use: function (n) {
        if ("function" != typeof n)
          throw new Error("Expected `fn` to be a function, not " + n);
        return e.push(n), t;
      },
    };
  return t;
}
var gn = yn;
function mn() {}
(mn.prototype = Error.prototype), (yn.prototype = new mn());
var vn = yn.prototype;
function yn(e, t, n) {
  var r, i, o;
  "string" == typeof t && ((n = t), (t = null)),
    (r = (function (e) {
      var t,
        n = [null, null];
      "string" == typeof e &&
        (-1 === (t = e.indexOf(":"))
          ? (n[1] = e)
          : ((n[0] = e.slice(0, t)), (n[1] = e.slice(t + 1))));
      return n;
    })(n)),
    (i = Ht(t) || "1:1"),
    (o = {
      start: { line: null, column: null },
      end: { line: null, column: null },
    }),
    t && t.position && (t = t.position),
    t && (t.start ? ((o = t), (t = t.start)) : (o.start = t)),
    e.stack && ((this.stack = e.stack), (e = e.message)),
    (this.message = e),
    (this.name = i),
    (this.reason = e),
    (this.line = t ? t.line : null),
    (this.column = t ? t.column : null),
    (this.location = o),
    (this.source = r[0]),
    (this.ruleId = r[1]);
}
(vn.file = ""),
  (vn.name = ""),
  (vn.reason = ""),
  (vn.message = ""),
  (vn.stack = ""),
  (vn.fatal = null),
  (vn.column = null),
  (vn.line = null);
var xn = c.default,
  kn = process,
  bn = Sn,
  wn = {}.hasOwnProperty,
  En = ["history", "path", "basename", "stem", "extname", "dirname"];
function Sn(e) {
  var t, n;
  if (e) {
    if ("string" == typeof e || Kt(e)) e = { contents: e };
    else if ("message" in e && "messages" in e) return e;
  } else e = {};
  if (!(this instanceof Sn)) return new Sn(e);
  for (
    this.data = {},
      this.messages = [],
      this.history = [],
      this.cwd = kn.cwd(),
      n = -1;
    ++n < En.length;

  )
    (t = En[n]), wn.call(e, t) && (this[t] = e[t]);
  for (t in e) En.indexOf(t) < 0 && (this[t] = e[t]);
}
function An(e, t) {
  if (e && e.indexOf(xn.sep) > -1)
    throw new Error(
      "`" + t + "` cannot be a path: did not expect `" + xn.sep + "`"
    );
}
function Cn(e, t) {
  if (!e) throw new Error("`" + t + "` cannot be empty");
}
function qn(e, t) {
  if (!e) throw new Error("Setting `" + t + "` requires `path` to be set too");
}
(Sn.prototype.toString = function (e) {
  return (this.contents || "").toString(e);
}),
  Object.defineProperty(Sn.prototype, "path", {
    get: function () {
      return this.history[this.history.length - 1];
    },
    set: function (e) {
      Cn(e, "path"), this.path !== e && this.history.push(e);
    },
  }),
  Object.defineProperty(Sn.prototype, "dirname", {
    get: function () {
      return "string" == typeof this.path ? xn.dirname(this.path) : void 0;
    },
    set: function (e) {
      qn(this.path, "dirname"), (this.path = xn.join(e || "", this.basename));
    },
  }),
  Object.defineProperty(Sn.prototype, "basename", {
    get: function () {
      return "string" == typeof this.path ? xn.basename(this.path) : void 0;
    },
    set: function (e) {
      Cn(e, "basename"),
        An(e, "basename"),
        (this.path = xn.join(this.dirname || "", e));
    },
  }),
  Object.defineProperty(Sn.prototype, "extname", {
    get: function () {
      return "string" == typeof this.path ? xn.extname(this.path) : void 0;
    },
    set: function (e) {
      if ((An(e, "extname"), qn(this.path, "extname"), e)) {
        if (46 !== e.charCodeAt(0))
          throw new Error("`extname` must start with `.`");
        if (e.indexOf(".", 1) > -1)
          throw new Error("`extname` cannot contain multiple dots");
      }
      this.path = xn.join(this.dirname, this.stem + (e || ""));
    },
  }),
  Object.defineProperty(Sn.prototype, "stem", {
    get: function () {
      return "string" == typeof this.path
        ? xn.basename(this.path, this.extname)
        : void 0;
    },
    set: function (e) {
      Cn(e, "stem"),
        An(e, "stem"),
        (this.path = xn.join(this.dirname || "", e + (this.extname || "")));
    },
  });
var Dn = bn;
(bn.prototype.message = function (e, t, n) {
  var r = new gn(e, t, n);
  this.path && ((r.name = this.path + ":" + r.name), (r.file = this.path));
  return (r.fatal = !1), this.messages.push(r), r;
}),
  (bn.prototype.info = function () {
    var e = this.message.apply(this, arguments);
    return (e.fatal = null), e;
  }),
  (bn.prototype.fail = function () {
    var e = this.message.apply(this, arguments);
    throw ((e.fatal = !0), e);
  });
var Tn = Dn,
  Ln = (function e() {
    var t,
      n = [],
      r = pn(),
      i = {},
      o = -1;
    return (
      (a.data = function (e, n) {
        if ("string" == typeof e)
          return 2 === arguments.length
            ? (zn("data", t), (i[e] = n), a)
            : (In.call(i, e) && i[e]) || null;
        if (e) return zn("data", t), (i = e), a;
        return i;
      }),
      (a.freeze = s),
      (a.attachers = n),
      (a.use = function (e) {
        var r;
        if ((zn("use", t), null == e));
        else if ("function" == typeof e) l.apply(null, arguments);
        else {
          if ("object" != typeof e)
            throw new Error("Expected usable value, not `" + e + "`");
          "length" in e ? u(e) : o(e);
        }
        r && (i.settings = cn(i.settings || {}, r));
        return a;
        function o(e) {
          u(e.plugins), e.settings && (r = cn(r || {}, e.settings));
        }
        function s(e) {
          if ("function" == typeof e) l(e);
          else {
            if ("object" != typeof e)
              throw new Error("Expected usable value, not `" + e + "`");
            "length" in e ? l.apply(null, e) : o(e);
          }
        }
        function u(e) {
          var t = -1;
          if (null == e);
          else {
            if ("object" != typeof e || !("length" in e))
              throw new Error("Expected a list of plugins, not `" + e + "`");
            for (; ++t < e.length; ) s(e[t]);
          }
        }
        function l(e, t) {
          var r = c(e);
          r
            ? (un(r[1]) && un(t) && (t = cn(!0, r[1], t)), (r[1] = t))
            : n.push(Fn.call(arguments));
        }
      }),
      (a.parse = function (e) {
        var t,
          n = Tn(e);
        if ((s(), Bn("parse", (t = a.Parser)), Rn(t, "parse")))
          return new t(String(n), n).parse();
        return t(String(n), n);
      }),
      (a.stringify = function (e, t) {
        var n,
          r = Tn(t);
        if ((s(), On("stringify", (n = a.Compiler)), _n(e), Rn(n, "compile")))
          return new n(e, r).compile();
        return n(e, r);
      }),
      (a.run = u),
      (a.runSync = function (e, t) {
        var n, r;
        return u(e, t, i), Mn("runSync", "run", r), n;
        function i(e, t) {
          (r = !0), (n = t), Zt(e);
        }
      }),
      (a.process = l),
      (a.processSync = function (e) {
        var t, n;
        return (
          s(),
          Bn("processSync", a.Parser),
          On("processSync", a.Compiler),
          l((t = Tn(e)), r),
          Mn("processSync", "process", n),
          t
        );
        function r(e) {
          (n = !0), Zt(e);
        }
      }),
      a
    );
    function a() {
      for (var t = e(), r = -1; ++r < n.length; ) t.use.apply(null, n[r]);
      return t.data(cn(!0, {}, i)), t;
    }
    function s() {
      var e, i;
      if (t) return a;
      for (; ++o < n.length; )
        !1 !== (e = n[o])[1] &&
          (!0 === e[1] && (e[1] = void 0),
          "function" == typeof (i = e[0].apply(a, e.slice(1))) && r.use(i));
      return (t = !0), (o = 1 / 0), a;
    }
    function c(e) {
      for (var t = -1; ++t < n.length; ) if (n[t][0] === e) return n[t];
    }
    function u(e, t, n) {
      if (
        (_n(e), s(), n || "function" != typeof t || ((n = t), (t = null)), !n)
      )
        return new Promise(i);
      function i(i, o) {
        r.run(e, Tn(t), function (t, r, a) {
          (r = r || e), t ? o(t) : i ? i(r) : n(null, r, a);
        });
      }
      i(null, n);
    }
    function l(e, t) {
      if ((s(), Bn("process", a.Parser), On("process", a.Compiler), !t))
        return new Promise(n);
      function n(n, r) {
        var i = Tn(e);
        Pn.run(a, { file: i }, function (e) {
          e ? r(e) : n ? n(i) : t(null, i);
        });
      }
      n(null, t);
    }
  })().freeze(),
  Fn = [].slice,
  In = {}.hasOwnProperty,
  Pn = pn()
    .use(function (e, t) {
      t.tree = e.parse(t.file);
    })
    .use(function (e, t, n) {
      e.run(t.tree, t.file, function (e, r, i) {
        e ? n(e) : ((t.tree = r), (t.file = i), n());
      });
    })
    .use(function (e, t) {
      var n = e.stringify(t.tree, t.file);
      null == n ||
        ("string" == typeof n || Kt(n)
          ? (t.file.contents = n)
          : (t.file.result = n));
    });
function Rn(e, t) {
  return (
    "function" == typeof e &&
    e.prototype &&
    ((function (e) {
      var t;
      for (t in e) return !0;
      return !1;
    })(e.prototype) ||
      t in e.prototype)
  );
}
function Bn(e, t) {
  if ("function" != typeof t)
    throw new Error("Cannot `" + e + "` without `Parser`");
}
function On(e, t) {
  if ("function" != typeof t)
    throw new Error("Cannot `" + e + "` without `Compiler`");
}
function zn(e, t) {
  if (t)
    throw new Error(
      "Cannot invoke `" +
        e +
        "` on a frozen processor.\nCreate a new processor first, by invoking it: use `processor()` instead of `processor`."
    );
}
function _n(e) {
  if (!e || "string" != typeof e.type)
    throw new Error("Expected node, got `" + e + "`");
}
function Mn(e, t, n) {
  if (!n)
    throw new Error("`" + e + "` finished async. Use `" + t + "` instead");
}
var Nn = m(function (e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }),
    (t.defaults = t.build = void 0);
  const n = {
    children: e => v.defaults.children(e),
    annotatetextnode: (e, t) => v.defaults.annotatetextnode(e, t),
    interpretmarkup: (e = "") => "\n".repeat((e.match(/\n/g) || []).length),
    remarkoptions: {},
  };
  (t.defaults = n),
    (t.build = function (e, t = n) {
      const r = Ln().use(Jt, t.remarkoptions).use(_, ["yaml", "toml"]);
      return v.build(e, r.parse, t);
    });
});
function Vn(t, n) {
  return u(this, void 0, void 0, function* () {
    const r = Nn.build(
        t,
        Object.assign(Object.assign({}, Nn.defaults), {
          interpretmarkup: (e = "") =>
            /^`[^`]+`$/.test(e)
              ? e
              : "\n".repeat((e.match(/\n/g) || []).length),
        })
      ),
      i = n(),
      { enabledCategories: o, disabledCategories: a } = (function (e) {
        return {
          enabledCategories: e.ruleOtherCategories
            ? e.ruleOtherCategories.split(",")
            : [],
          disabledCategories: e.ruleOtherDisabledRules
            ? e.ruleOtherDisabledRules.split(",")
            : [],
        };
      })(i),
      s = {
        data: JSON.stringify(r),
        language: "auto",
        enabledOnly: "false",
        level: i.pickyMode ? "picky" : "default",
      };
    let c, u;
    o.length && (s.enabledCategories = o.join(",")),
      a.length && (s.disabledCategories = a.join(",")),
      i.ruleOtherRules && (s.enabledRules = i.ruleOtherRules),
      i.ruleOtherDisabledRules && (s.disabledRules = i.ruleOtherDisabledRules),
      i.apikey &&
        i.username &&
        i.apikey.length > 1 &&
        i.username.length > 1 &&
        ((s.username = i.username), (s.apiKey = i.apikey)),
      i.staticLanguage &&
        i.staticLanguage.length > 0 &&
        "auto" !== i.staticLanguage &&
        (s.language = i.staticLanguage);
    try {
      c = yield fetch(`${i.serverUrl}/v2/check`, {
        method: "POST",
        body: Object.keys(s)
          .map(e => `${encodeURIComponent(e)}=${encodeURIComponent(s[e])}`)
          .join("&"),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      });
    } catch (t) {
      return (
        new e.Notice(
          "Request to LanguageTool server failed. Please check your connection and LanguageTool server URL",
          5e3
        ),
        Promise.reject(t)
      );
    }
    if (!c.ok)
      return (
        new e.Notice(`request to LanguageTool failed\n${c.statusText}`, 5e3),
        Promise.reject(
          new Error(`unexpected status ${c.status}, see network tab`)
        )
      );
    try {
      u = yield c.json();
    } catch (t) {
      return (
        new e.Notice("Error processing response from LanguageTool server", 5e3),
        Promise.reject(t)
      );
    }
    return u;
  });
}
function Un(t) {
  let n = -1,
    i = 1 / 0,
    o = -1 / 0;
  return r.EditorView.inputHandler.of((r, a, s, c) => {
    if (!t.settings.shouldAutoCheck || !c.trim()) return !1;
    const u = r.state.field(e.editorViewField);
    return (
      (i = Math.min(i, Math.min(a, s))),
      (o = Math.max(o, Math.max(a, s))),
      clearTimeout(n),
      (n = window.setTimeout(() => {
        const e = r.lineBlockAt(i),
          n = r.lineBlockAt(o);
        t.runDetection(r, u, e.from, n.to).catch(e => {
          console.error(e);
        });
      }, 3e3)),
      !1
    );
  });
}
const jn = i.StateEffect.define(),
  Hn = i.StateEffect.define(),
  Gn = i.StateEffect.define();
function Wn(e, t, n, r) {
  return (
    !(e >= n && e <= r) &&
    !(t >= n && t <= r) &&
    !(n >= e && n <= t) &&
    !(r >= e && r <= t)
  );
}
const Qn = i.StateField.define({
  create: () => r.Decoration.none,
  update(e, t) {
    const n = new Set(),
      i = {};
    let s = null;
    e = e.map(t.changes);
    const c = e => {
        if (void 0 !== i[e]) return i[e];
        s || (s = o.syntaxTree(t.state));
        const n = s.resolveInner(e, 1).type.prop(a.tokenClassNodeProp);
        return n && d.test(n) ? (i[e] = !1) : (i[e] = !0), i[e];
      },
      u = (e, n, r) => {
        if ("TYPOS" === e.rule.category.id) {
          const e = window.app.vault.getConfig("spellcheckDictionary"),
            i = t.state.sliceDoc(n, r);
          if (e && e.includes(i)) return !1;
        }
        s || (s = o.syntaxTree(t.state));
        const i = s
          .resolve(t.newDoc.lineAt(n).from, 1)
          .type.prop(a.tokenClassNodeProp);
        return (
          !(null == i ? void 0 : i.includes("table")) ||
          "WHITESPACE_RULE" !== e.rule.id
        );
      };
    t.docChanged &&
      t.selection &&
      e.size &&
      (e = e.update({
        filter: (e, n) => Wn(e, n, t.selection.main.from, t.selection.main.to),
      }));
    for (const i of t.effects)
      if (i.is(jn)) {
        const { from: t, to: o, match: a } = i.value,
          s = `${t}${o}`;
        !n.has(s) &&
          c(t) &&
          c(o) &&
          u(a, t, o) &&
          (n.add(s),
          (e = e.update({
            add: [
              r.Decoration.mark({
                class: `lt-underline ${g(a.rule.category.id)}`,
                match: a,
              }).range(t, o),
            ],
          })));
      } else
        i.is(Hn)
          ? (e = r.Decoration.none)
          : i.is(Gn) &&
            (e = e.update({
              filter: (e, t) => Wn(e, t, i.value.from, i.value.to),
            }));
    return e;
  },
  provide: e => r.EditorView.decorations.from(e),
});
function Yn(t, n, r) {
  const i = r.match,
    o = i.message,
    a = i.shortMessage,
    s = (i.replacements || [])
      .slice(0, 3)
      .map(e => e.value)
      .filter(e => e.trim()),
    c = i.rule.category.id,
    u = t.settings.glassBg
      ? "lt-predictions-container-glass"
      : "lt-predictions-container";
  return createDiv({ cls: [u, g(c)] }, i => {
    a &&
      i.createSpan({ cls: "lt-title" }, e => {
        e.createSpan({ text: a });
      }),
      o && i.createSpan({ cls: "lt-message", text: o });
    const u = Gn.of({
      from: n.state.selection.main.from,
      to: n.state.selection.main.to,
    });
    s.length &&
      i.createDiv({ cls: "lt-buttoncontainer" }, e => {
        for (const t of s)
          e.createEl("button", { text: t }, e => {
            e.onclick = () => {
              n.dispatch({
                changes: [{ from: r.from, to: r.to, insert: t }],
                effects: [u],
              });
            };
          });
      }),
      i.createDiv({ cls: "lt-ignorecontainer" }, i => {
        i.createEl("button", { cls: "lt-ignore-btn" }, i => {
          "TYPOS" === c
            ? (e.setIcon(i.createSpan(), "plus-with-circle"),
              i.createSpan({ text: "Add to personal dictionary" }),
              (i.onclick = () => {
                const e = t.app.vault.getConfig("spellcheckDictionary") || [];
                t.app.vault.setConfig("spellcheckDictionary", [
                  ...e,
                  n.state.sliceDoc(r.from, r.to),
                ]),
                  n.dispatch({ effects: [u] });
              }))
            : (e.setIcon(i.createSpan(), "cross"),
              i.createSpan({ text: "Ignore suggestion" }),
              (i.onclick = () => {
                n.dispatch({ effects: [u] });
              }));
        });
      });
  });
}
function $n(e, t, n) {
  const r = n.field(Qn);
  if (0 === r.size || n.selection.ranges.length > 1) return [];
  let i = null;
  if (
    (r.between(n.selection.main.from, n.selection.main.to, (e, t, n) => {
      i = { from: e, to: t, match: n.spec.match };
    }),
    null !== i)
  ) {
    const { from: n, to: r } = i;
    if (e.length) {
      const t = e[0];
      if (t.pos === n && t.end === r) return e;
    }
    return [
      {
        pos: n,
        end: r,
        above: !0,
        strictSide: !1,
        arrow: !1,
        create: e => ({ dom: Yn(t, e, i) }),
      },
    ];
  }
  return [];
}
function Jn(e) {
  return i.StateField.define({
    create: t => $n([], e, t),
    update: (t, n) => $n(t, e, n.state),
    provide: e => n.showTooltip.computeN([e], t => t.field(e)),
  });
}
class Zn {
  constructor(t, n) {
    const r = t.match.message,
      i = t.match.shortMessage,
      o = (t.match.replacements || []).slice(0, 3).map(e => e.value),
      a = t.match.rule.category.id;
    (this.elem = createDiv({ cls: [n, g(a)] }, n => {
      n.style.setProperty("left", `${t.position.left}px`),
        n.style.setProperty("top", `${t.position.bottom}px`),
        i &&
          n.createSpan({ cls: "lt-title" }, e => {
            e.createSpan({ text: i });
          }),
        r && n.createSpan({ cls: "lt-message", text: r }),
        o.length &&
          n.createDiv({ cls: "lt-buttoncontainer" }, e => {
            for (const n of o)
              e.createEl("button", { text: n }, e => {
                e.onclick = () => {
                  t.onClick(n);
                };
              });
          }),
        n.createDiv({ cls: "lt-ignorecontainer" }, n => {
          n.createEl("button", { cls: "lt-ignore-btn" }, n => {
            "TYPOS" === a
              ? (e.setIcon(n.createSpan(), "plus-with-circle"),
                n.createSpan({ text: "Add to personal dictionary" }),
                (n.onclick = () => {
                  t.addToDictionary(t.matchedString);
                }))
              : (e.setIcon(n.createSpan(), "cross"),
                n.createSpan({ text: "Ignore suggestion" }),
                (n.onclick = () => {
                  t.ignoreSuggestion();
                }));
          });
        });
    })),
      document.body.append(this.elem);
    const s = this.elem.clientHeight,
      c = this.elem.clientWidth;
    t.position.bottom + s > window.innerHeight &&
      this.elem.style.setProperty("top", t.position.top - s + "px"),
      t.position.left + c > window.innerWidth &&
        this.elem.style.setProperty("left", window.innerWidth - c - 15 + "px");
  }
  get element() {
    return this.elem;
  }
  destroy() {
    var e;
    null === (e = this.elem) || void 0 === e || e.remove();
  }
}
function Kn(e, t) {
  if (!e.getLine(t.line)) return !1;
  const n = e.getTokenTypeAt(t);
  return !n || !d.test(n);
}
function Xn(e, t, n, r) {
  const i = t => {
    var n;
    (null === (n = t.attributes) || void 0 === n ? void 0 : n.isIgnored) ||
      (e.delete(t), t.clear());
  };
  if (n && r) return t.findMarks(n, r).forEach(i);
  t.getAllMarks().forEach(i);
}
class er {
  constructor(e) {
    (this.onCodemirrorChange = (e, t) => {
      if (
        (this.openWidget &&
          (this.openWidget.destroy(), (this.openWidget = void 0)),
        this.markerMap.size > 0 && t.origin && "+" === t.origin[0])
      ) {
        const n = e.findMarksAt(t.from);
        n.length && n.forEach(e => e.clear());
      }
      if (
        this.plugin.settings.shouldAutoCheck &&
        t.origin &&
        ("+" === t.origin[0] || "paste" === t.origin)
      ) {
        const n = this.dirtyLines.has(e) ? this.dirtyLines.get(e) : [];
        t.text.forEach((r, i) => {
          const o = t.from.line + i;
          Kn(e, Object.assign(Object.assign({}, t.from), { line: o })) &&
            n.push(o);
        }),
          this.dirtyLines.set(e, n),
          this.plugin.setStatusBarWorking(),
          this.checkLines(e);
      }
    }),
      (this.runAutoDetection = e =>
        u(this, void 0, void 0, function* () {
          const t = this.dirtyLines.get(e);
          if (!t || 0 === t.length) return this.plugin.setStatusBarReady();
          this.dirtyLines.delete(e);
          const n = t.sort((e, t) => e - t),
            r = n[n.length - 1],
            i = e.getLine(r),
            o = { line: n[0], ch: 0 },
            a = { line: n[n.length - 1], ch: i.length };
          try {
            yield this.runDetection(e, o, a);
          } catch (e) {
            console.error(e), this.plugin.setStatusBarReady();
          }
        })),
      (this.plugin = e),
      (this.app = e.app);
  }
  onload() {
    return u(this, void 0, void 0, function* () {
      (this.markerMap = new Map()),
        (this.hashLru = new l({ maxSize: 10 })),
        (this.dirtyLines = new WeakMap()),
        (this.checkLines = e.debounce(this.runAutoDetection, 3e3, !0)),
        this.initLegacyEditorHandler();
    });
  }
  onunload() {
    this.openWidget && (this.openWidget.destroy(), (this.openWidget = void 0)),
      this.app.workspace.iterateCodeMirrors(e => {
        Xn(this.markerMap, e), e.off("change", this.onCodemirrorChange);
      });
  }
  initLegacyEditorHandler() {
    this.plugin.registerCodeMirror(e => {
      e.on("change", this.onCodemirrorChange);
    }),
      this.plugin.registerDomEvent(document, "pointerup", t => {
        var n, r;
        const i = this.app.workspace.getActiveViewOfType(e.MarkdownView);
        if (!i) return;
        if (
          t.target ===
            (null === (n = this.openWidget) || void 0 === n
              ? void 0
              : n.element) ||
          (null === (r = this.openWidget) || void 0 === r
            ? void 0
            : r.element.contains(t.target))
        )
          return;
        if (
          (this.openWidget &&
            (this.openWidget.destroy(), (this.openWidget = void 0)),
          0 === this.markerMap.size ||
            (t.target instanceof HTMLElement &&
              !t.target.hasClass("lt-underline")))
        )
          return;
        const o = i.editor.cm;
        if (!o.getWrapperElement().contains(t.target)) return;
        const a = o.coordsChar({ left: t.clientX, top: t.clientY }),
          s = o.findMarksAt(a);
        if (0 === s.length) return;
        const c = s[0],
          u = this.markerMap.get(c);
        if (!u) return;
        const { from: l, to: f } = c.find(),
          p = o.cursorCoords(l),
          d = o.getRange(l, f);
        this.openWidget = new Zn(
          {
            match: u,
            matchedString: d,
            position: p,
            onClick: e => {
              var t;
              o.replaceRange(e, l, f),
                c.clear(),
                null === (t = this.openWidget) || void 0 === t || t.destroy(),
                (this.openWidget = void 0);
            },
            addToDictionary: e => {
              var t;
              const n = this.app.vault.getConfig("spellcheckDictionary") || [];
              this.app.vault.setConfig("spellcheckDictionary", [...n, e]),
                c.clear(),
                null === (t = this.openWidget) || void 0 === t || t.destroy(),
                (this.openWidget = void 0);
            },
            ignoreSuggestion: () => {
              var e;
              o.markText(l, f, {
                clearOnEnter: !1,
                attributes: { isIgnored: "true" },
              }),
                c.clear(),
                null === (e = this.openWidget) || void 0 === e || e.destroy(),
                (this.openWidget = void 0);
            },
          },
          this.plugin.settings.glassBg
            ? "lt-predictions-container-glass"
            : "lt-predictions-container"
        );
      });
  }
  runDetection(e, t, n) {
    return u(this, void 0, void 0, function* () {
      this.plugin.setStatusBarWorking();
      const r = e.getDoc(),
        i = t && n ? e.getRange(t, n) : e.getValue(),
        o = t && n ? r.indexFromPos(t) : 0,
        a = h(i);
      if (this.hashLru.has(a)) return this.hashLru.get(a);
      let s;
      try {
        (s = yield Vn(i, () => this.plugin.settings)), this.hashLru.set(a, s);
      } catch (e) {
        return this.plugin.setStatusBarReady(), Promise.reject(e);
      }
      if (
        (t && n ? Xn(this.markerMap, e, t, n) : Xn(this.markerMap, e),
        !s.matches)
      )
        return this.plugin.setStatusBarReady();
      for (const t of s.matches) {
        const n = r.posFromIndex(t.offset + o),
          i = e.findMarksAt(n);
        if (i && i.length > 0) continue;
        const a = r.posFromIndex(t.offset + o + t.length);
        if (!Kn(e, n) || !Kn(e, a) || !this.matchAllowed(e, t, n, a)) continue;
        const s = e.markText(n, a, {
          className: `lt-underline ${g(t.rule.category.id)}`,
          clearOnEnter: !1,
        });
        this.markerMap.set(s, t);
      }
      this.plugin.setStatusBarReady();
    });
  }
  matchAllowed(e, t, n, r) {
    var i;
    const o = e.getRange(n, r);
    if ("TYPOS" === t.rule.category.id) {
      const e = this.app.vault.getConfig("spellcheckDictionary");
      if (e && e.includes(o)) return !1;
    }
    const a = e.getLineTokens(n.line);
    return (
      !a.length ||
      !(null === (i = a[0].type) || void 0 === i
        ? void 0
        : i.includes("table")) ||
      "WHITESPACE_RULE" !== t.rule.id
    );
  }
}
class tr extends e.Plugin {
  constructor() {
    super(...arguments),
      (this.isloading = !1),
      (this.handleStatusBarClick = () => {
        var t;
        const n =
            null === (t = this.statusBarText.parentElement) || void 0 === t
              ? void 0
              : t.getBoundingClientRect(),
          r = this.statusBarText.getBoundingClientRect();
        new e.Menu(this.app)
          .addItem(t => {
            t.setTitle("Check current document"),
              t.setIcon("checkbox-glyph"),
              t.onClick(() =>
                u(this, void 0, void 0, function* () {
                  const t = this.app.workspace.activeLeaf;
                  if (
                    (null == t ? void 0 : t.view) instanceof e.MarkdownView &&
                    "source" === t.view.getMode()
                  )
                    try {
                      this.isLegacyEditor
                        ? yield this.legacyPlugin.runDetection(t.view.editor.cm)
                        : yield this.runDetection(t.view.editor.cm, t.view);
                    } catch (e) {
                      console.error(e);
                    }
                })
              );
          })
          .addItem(e => {
            e.setTitle(
              this.settings.shouldAutoCheck
                ? "Disable automatic checking"
                : "Enable automatic checking"
            ),
              e.setIcon("uppercase-lowercase-a"),
              e.onClick(() =>
                u(this, void 0, void 0, function* () {
                  (this.settings.shouldAutoCheck =
                    !this.settings.shouldAutoCheck),
                    yield this.saveSettings();
                })
              );
          })
          .addItem(t => {
            t.setTitle("Clear suggestions"),
              t.setIcon("reset"),
              t.onClick(() => {
                const t = this.app.workspace.getActiveViewOfType(
                  e.MarkdownView
                );
                if (t)
                  if (this.isLegacyEditor) {
                    const e = t.editor.cm;
                    Xn(this.legacyPlugin.markerMap, e);
                  } else {
                    t.editor.cm.dispatch({ effects: [Hn.of(null)] });
                  }
              });
          })
          .showAtPosition({
            x: r.right + 5,
            y: ((null == n ? void 0 : n.top) || 0) - 5,
          });
      });
  }
  onload() {
    return u(this, void 0, void 0, function* () {
      if (
        ((this.isLegacyEditor = Boolean(
          this.app.vault.getConfig("legacyEditor")
        )),
        yield this.loadSettings(),
        this.settings.serverUrl.includes("/v2/check"))
      ) {
        new e.Notice(
          "invalid or outdated LanguageTool Settings, I'm trying to fix it.\nIf it does not work, simply reinstall the plugin",
          1e4
        ),
          (this.settings.serverUrl = this.settings.serverUrl.replace(
            "/v2/check",
            ""
          ));
        try {
          yield this.saveSettings();
        } catch (e) {
          console.error(e);
        }
      }
      var t;
      this.addSettingTab(new p(this.app, this)),
        this.app.workspace.onLayoutReady(() => {
          (this.statusBarText = this.addStatusBarItem()),
            this.setStatusBarReady(),
            this.registerDomEvent(
              this.statusBarText,
              "click",
              this.handleStatusBarClick
            );
        }),
        this.isLegacyEditor
          ? ((this.legacyPlugin = new er(this)),
            yield this.legacyPlugin.onload())
          : ((this.hashLru = new l({ maxSize: 10 })),
            this.registerEditorExtension(
              ((t = this),
              [
                n.tooltips({
                  position: "absolute",
                  tooltipSpace: e => {
                    const t = e.dom.getBoundingClientRect();
                    return {
                      top: t.top,
                      left: t.left,
                      bottom: t.bottom,
                      right: t.right,
                    };
                  },
                }),
                Qn,
                Jn(t),
                Un(t),
              ])
            )),
        this.registerCommands();
    });
  }
  onunload() {
    this.isLegacyEditor && this.legacyPlugin.onunload(), this.hashLru.clear();
  }
  registerCommands() {
    this.addCommand({
      id: "ltcheck-text",
      name: "Check Text",
      editorCallback: (e, t) => {
        if (this.isLegacyEditor) {
          const t = e.cm;
          e.somethingSelected()
            ? this.legacyPlugin
                .runDetection(t, t.getCursor("from"), t.getCursor("to"))
                .catch(e => {
                  console.error(e);
                })
            : this.legacyPlugin.runDetection(t).catch(e => {
                console.error(e);
              });
        } else
          this.runDetection(e.cm, t).catch(e => {
            console.error(e);
          });
      },
    }),
      this.addCommand({
        id: "ltautocheck-text",
        name: "Toggle Automatic Checking",
        callback: () =>
          u(this, void 0, void 0, function* () {
            (this.settings.shouldAutoCheck = !this.settings.shouldAutoCheck),
              yield this.saveSettings();
          }),
      }),
      this.addCommand({
        id: "ltclear",
        name: "Clear Suggestions",
        editorCallback: e => {
          if (this.isLegacyEditor) {
            if (this.legacyPlugin.markerMap.size > 0) {
              const t = e.cm;
              Xn(this.legacyPlugin.markerMap, t);
            }
          } else {
            e.cm.dispatch({ effects: [Hn.of(null)] });
          }
        },
      });
  }
  setStatusBarReady() {
    (this.isloading = !1),
      this.statusBarText.empty(),
      this.statusBarText.createSpan({ cls: "lt-status-bar-btn" }, e => {
        e.createSpan({ cls: "lt-status-bar-check-icon", text: "Aa" });
      });
  }
  setStatusBarWorking() {
    this.isloading ||
      ((this.isloading = !0),
      this.statusBarText.empty(),
      this.statusBarText.createSpan(
        { cls: ["lt-status-bar-btn", "lt-loading"] },
        t => {
          e.setIcon(t, "sync-small");
        }
      ));
  }
  runDetection(e, t, n, r) {
    return u(this, void 0, void 0, function* () {
      this.setStatusBarWorking();
      const i = e.state.selection.main;
      let o = t.data,
        a = 0,
        s = !1,
        c = 0,
        u = 0;
      void 0 === n && i && i.from !== i.to && ((n = i.from), (r = i.to)),
        void 0 !== n &&
          void 0 !== r &&
          ((o = e.state.sliceDoc(n, r)), (a = n), (c = n), (u = r), (s = !0));
      const l = h(o);
      if (this.hashLru.has(l)) return this.hashLru.get(l);
      let f;
      try {
        (f = yield Vn(o, () => this.settings)), this.hashLru.set(l, f);
      } catch (e) {
        return this.setStatusBarReady(), Promise.reject(e);
      }
      const p = [];
      if (
        (s ? p.push(Gn.of({ from: c, to: u })) : p.push(Hn.of(null)), f.matches)
      )
        for (const e of f.matches) {
          const t = e.offset + a,
            n = e.offset + a + e.length;
          p.push(jn.of({ from: t, to: n, match: e }));
        }
      p.length && e.dispatch({ effects: p }), this.setStatusBarReady();
    });
  }
  loadSettings() {
    return u(this, void 0, void 0, function* () {
      this.settings = Object.assign({}, f, yield this.loadData());
    });
  }
  saveSettings() {
    return u(this, void 0, void 0, function* () {
      yield this.saveData(this.settings);
    });
  }
}
module.exports = tr;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIm5vZGVfbW9kdWxlcy9xdWljay1scnUvaW5kZXguanMiLCJzcmMvU2V0dGluZ3NUYWIudHMiLCJzcmMvaGVscGVycy50cyIsIm5vZGVfbW9kdWxlcy9hbm5vdGF0ZWR0ZXh0L291dC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mb3JtYXQvZm9ybWF0LmpzIiwibm9kZV9tb2R1bGVzL2ZhdWx0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay1leHRlbnNpb24tZnJvbnRtYXR0ZXIvbGliL21hdHRlcnMuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrLWV4dGVuc2lvbi1mcm9udG1hdHRlci9saWIvc3ludGF4LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay1leHRlbnNpb24tZnJvbnRtYXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWRhc3QtdXRpbC1mcm9udG1hdHRlci9mcm9tLW1hcmtkb3duLmpzIiwibm9kZV9tb2R1bGVzL21kYXN0LXV0aWwtZnJvbnRtYXR0ZXIvdG8tbWFya2Rvd24uanMiLCJub2RlX21vZHVsZXMvcmVtYXJrLWZyb250bWF0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21kYXN0LXV0aWwtdG8tc3RyaW5nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L2NvbnN0YW50L2Fzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jb25zdGFudC9oYXMtb3duLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3V0aWwvbm9ybWFsaXplLWlkZW50aWZpZXIuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvY29uc3RhbnQvZnJvbS1jaGFyLWNvZGUuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdXRpbC9zYWZlLWZyb20taW50LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jaGFyYWN0ZXIvbWFya2Rvd24tc3BhY2UuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvZmFjdG9yeS1zcGFjZS5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9pbml0aWFsaXplL2NvbnRlbnQuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvcGFydGlhbC1ibGFuay1saW5lLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L2luaXRpYWxpemUvZG9jdW1lbnQuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdXRpbC9zaXplLWNodW5rcy5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC91dGlsL3ByZWZpeC1zaXplLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L2NvbnN0YW50L3NwbGljZS5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC91dGlsL2NodW5rZWQtc3BsaWNlLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3V0aWwvc2hhbGxvdy5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC91dGlsL3N1YnRva2VuaXplLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2NvbnRlbnQuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvaW5pdGlhbGl6ZS9mbG93LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L2luaXRpYWxpemUvdGV4dC5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC91dGlsL21pbmlmbGF0LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3V0aWwvY29tYmluZS1leHRlbnNpb25zLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3V0aWwvY2h1bmtlZC1wdXNoLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3V0aWwvcmVzb2x2ZS1hbGwuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdXRpbC9zZXJpYWxpemUtY2h1bmtzLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3V0aWwvc2xpY2UtY2h1bmtzLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3V0aWwvY3JlYXRlLXRva2VuaXplci5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmctb3Itc3BhY2UuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdXRpbC9yZWdleC1jaGVjay5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jaGFyYWN0ZXIvdW5pY29kZS1wdW5jdHVhdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jb25zdGFudC91bmljb2RlLXB1bmN0dWF0aW9uLXJlZ2V4LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L2NoYXJhY3Rlci91bmljb2RlLXdoaXRlc3BhY2UuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdXRpbC9jbGFzc2lmeS1jaGFyYWN0ZXIuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdXRpbC9tb3ZlLXBvaW50LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2F0dGVudGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jaGFyYWN0ZXIvYXNjaWktYWxwaGEuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvY2hhcmFjdGVyL2FzY2lpLWFscGhhbnVtZXJpYy5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jaGFyYWN0ZXIvYXNjaWktYXRleHQuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvY2hhcmFjdGVyL2FzY2lpLWNvbnRyb2wuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvYXV0b2xpbmsuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvYmxvY2stcXVvdGUuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvY2hhcmFjdGVyL2FzY2lpLXB1bmN0dWF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2NoYXJhY3Rlci1lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvcGFyc2UtZW50aXRpZXMvZGVjb2RlLWVudGl0eS5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jaGFyYWN0ZXIvYXNjaWktZGlnaXQuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvY2hhcmFjdGVyL2FzY2lpLWhleC1kaWdpdC5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC90b2tlbml6ZS9jaGFyYWN0ZXItcmVmZXJlbmNlLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2NvZGUtZmVuY2VkLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2NvZGUtaW5kZW50ZWQuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvZmFjdG9yeS1kZXN0aW5hdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC90b2tlbml6ZS9mYWN0b3J5LWxhYmVsLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2ZhY3Rvcnktd2hpdGVzcGFjZS5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC90b2tlbml6ZS9mYWN0b3J5LXRpdGxlLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2RlZmluaXRpb24uanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvaGFyZC1icmVhay1lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvaGVhZGluZy1hdHguanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvY29uc3RhbnQvaHRtbC1ibG9jay1uYW1lcy5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jb25zdGFudC9odG1sLXJhdy1uYW1lcy5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC90b2tlbml6ZS9odG1sLWZsb3cuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvaHRtbC10ZXh0LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2xhYmVsLWVuZC5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC90b2tlbml6ZS9sYWJlbC1zdGFydC1saW5rLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2xpbmUtZW5kaW5nLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL3RoZW1hdGljLWJyZWFrLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2xpc3QuanMiLCJub2RlX21vZHVsZXMvbWljcm9tYXJrL2Rpc3QvdG9rZW5pemUvc2V0ZXh0LXVuZGVybGluZS5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9jb25zdHJ1Y3RzLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2xhYmVsLXN0YXJ0LWltYWdlLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Rva2VuaXplL2NvZGUtdGV4dC5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9wYXJzZS5qcyIsIm5vZGVfbW9kdWxlcy9taWNyb21hcmsvZGlzdC9wcmVwcm9jZXNzLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvbWFyay9kaXN0L3Bvc3Rwcm9jZXNzLmpzIiwibm9kZV9tb2R1bGVzL3VuaXN0LXV0aWwtc3RyaW5naWZ5LXBvc2l0aW9uL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21kYXN0LXV0aWwtZnJvbS1tYXJrZG93bi9kaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21kYXN0LXV0aWwtZnJvbS1tYXJrZG93bi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmstcGFyc2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYmFpbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXh0ZW5kL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2lzLXBsYWluLW9iai9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90cm91Z2gvd3JhcC5qcyIsIm5vZGVfbW9kdWxlcy90cm91Z2gvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdmZpbGUtbWVzc2FnZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy92ZmlsZS9saWIvbWlucGF0aC5qcyIsIm5vZGVfbW9kdWxlcy92ZmlsZS9saWIvbWlucHJvYy5qcyIsIm5vZGVfbW9kdWxlcy92ZmlsZS9saWIvY29yZS5qcyIsIm5vZGVfbW9kdWxlcy92ZmlsZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdmZpbGUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdW5pZmllZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hbm5vdGF0ZWR0ZXh0LXJlbWFyay9vdXQvaW5kZXguanMiLCJzcmMvYXBpLnRzIiwic3JjL2NtNi9idWlsZEF1dG9DaGVja0hhbmRsZXIudHMiLCJzcmMvY202L3VuZGVybGluZVN0YXRlRmllbGQudHMiLCJzcmMvY202L3Rvb2x0aXBGaWVsZC50cyIsInNyYy9jbTUvTGVnYWN5V2lkZ2V0LnRzIiwic3JjL2NtNS9oZWxwZXJzLnRzIiwic3JjL2NtNS9MZWdhY3lQbHVnaW4udHMiLCJzcmMvaW5kZXgudHMiLCJzcmMvY202L3VuZGVybGluZUV4dGVuc2lvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSkge1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gZnJvbS5sZW5ndGgsIGogPSB0by5sZW5ndGg7IGkgPCBpbDsgaSsrLCBqKyspXHJcbiAgICAgICAgdG9bal0gPSBmcm9tW2ldO1xyXG4gICAgcmV0dXJuIHRvO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgUXVpY2tMUlUge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcblx0XHRpZiAoIShvcHRpb25zLm1heFNpemUgJiYgb3B0aW9ucy5tYXhTaXplID4gMCkpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ2BtYXhTaXplYCBtdXN0IGJlIGEgbnVtYmVyIGdyZWF0ZXIgdGhhbiAwJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBvcHRpb25zLm1heEFnZSA9PT0gJ251bWJlcicgJiYgb3B0aW9ucy5tYXhBZ2UgPT09IDApIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ2BtYXhBZ2VgIG11c3QgYmUgYSBudW1iZXIgZ3JlYXRlciB0aGFuIDAnKTtcblx0XHR9XG5cblx0XHQvLyBUT0RPOiBVc2UgcHJpdmF0ZSBjbGFzcyBmaWVsZHMgd2hlbiBFU0xpbnQgc3VwcG9ydHMgdGhlbS5cblx0XHR0aGlzLm1heFNpemUgPSBvcHRpb25zLm1heFNpemU7XG5cdFx0dGhpcy5tYXhBZ2UgPSBvcHRpb25zLm1heEFnZSB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG5cdFx0dGhpcy5vbkV2aWN0aW9uID0gb3B0aW9ucy5vbkV2aWN0aW9uO1xuXHRcdHRoaXMuY2FjaGUgPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5vbGRDYWNoZSA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLl9zaXplID0gMDtcblx0fVxuXG5cdC8vIFRPRE86IFVzZSBwcml2YXRlIGNsYXNzIG1ldGhvZHMgd2hlbiB0YXJnZXRpbmcgTm9kZS5qcyAxNi5cblx0X2VtaXRFdmljdGlvbnMoY2FjaGUpIHtcblx0XHRpZiAodHlwZW9mIHRoaXMub25FdmljdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgW2tleSwgaXRlbV0gb2YgY2FjaGUpIHtcblx0XHRcdHRoaXMub25FdmljdGlvbihrZXksIGl0ZW0udmFsdWUpO1xuXHRcdH1cblx0fVxuXG5cdF9kZWxldGVJZkV4cGlyZWQoa2V5LCBpdGVtKSB7XG5cdFx0aWYgKHR5cGVvZiBpdGVtLmV4cGlyeSA9PT0gJ251bWJlcicgJiYgaXRlbS5leHBpcnkgPD0gRGF0ZS5ub3coKSkge1xuXHRcdFx0aWYgKHR5cGVvZiB0aGlzLm9uRXZpY3Rpb24gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dGhpcy5vbkV2aWN0aW9uKGtleSwgaXRlbS52YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzLmRlbGV0ZShrZXkpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdF9nZXRPckRlbGV0ZUlmRXhwaXJlZChrZXksIGl0ZW0pIHtcblx0XHRjb25zdCBkZWxldGVkID0gdGhpcy5fZGVsZXRlSWZFeHBpcmVkKGtleSwgaXRlbSk7XG5cdFx0aWYgKGRlbGV0ZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gaXRlbS52YWx1ZTtcblx0XHR9XG5cdH1cblxuXHRfZ2V0SXRlbVZhbHVlKGtleSwgaXRlbSkge1xuXHRcdHJldHVybiBpdGVtLmV4cGlyeSA/IHRoaXMuX2dldE9yRGVsZXRlSWZFeHBpcmVkKGtleSwgaXRlbSkgOiBpdGVtLnZhbHVlO1xuXHR9XG5cblx0X3BlZWsoa2V5LCBjYWNoZSkge1xuXHRcdGNvbnN0IGl0ZW0gPSBjYWNoZS5nZXQoa2V5KTtcblxuXHRcdHJldHVybiB0aGlzLl9nZXRJdGVtVmFsdWUoa2V5LCBpdGVtKTtcblx0fVxuXG5cdF9zZXQoa2V5LCB2YWx1ZSkge1xuXHRcdHRoaXMuY2FjaGUuc2V0KGtleSwgdmFsdWUpO1xuXHRcdHRoaXMuX3NpemUrKztcblxuXHRcdGlmICh0aGlzLl9zaXplID49IHRoaXMubWF4U2l6ZSkge1xuXHRcdFx0dGhpcy5fc2l6ZSA9IDA7XG5cdFx0XHR0aGlzLl9lbWl0RXZpY3Rpb25zKHRoaXMub2xkQ2FjaGUpO1xuXHRcdFx0dGhpcy5vbGRDYWNoZSA9IHRoaXMuY2FjaGU7XG5cdFx0XHR0aGlzLmNhY2hlID0gbmV3IE1hcCgpO1xuXHRcdH1cblx0fVxuXG5cdF9tb3ZlVG9SZWNlbnQoa2V5LCBpdGVtKSB7XG5cdFx0dGhpcy5vbGRDYWNoZS5kZWxldGUoa2V5KTtcblx0XHR0aGlzLl9zZXQoa2V5LCBpdGVtKTtcblx0fVxuXG5cdCogX2VudHJpZXNBc2NlbmRpbmcoKSB7XG5cdFx0Zm9yIChjb25zdCBpdGVtIG9mIHRoaXMub2xkQ2FjaGUpIHtcblx0XHRcdGNvbnN0IFtrZXksIHZhbHVlXSA9IGl0ZW07XG5cdFx0XHRpZiAoIXRoaXMuY2FjaGUuaGFzKGtleSkpIHtcblx0XHRcdFx0Y29uc3QgZGVsZXRlZCA9IHRoaXMuX2RlbGV0ZUlmRXhwaXJlZChrZXksIHZhbHVlKTtcblx0XHRcdFx0aWYgKGRlbGV0ZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0eWllbGQgaXRlbTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLmNhY2hlKSB7XG5cdFx0XHRjb25zdCBba2V5LCB2YWx1ZV0gPSBpdGVtO1xuXHRcdFx0Y29uc3QgZGVsZXRlZCA9IHRoaXMuX2RlbGV0ZUlmRXhwaXJlZChrZXksIHZhbHVlKTtcblx0XHRcdGlmIChkZWxldGVkID09PSBmYWxzZSkge1xuXHRcdFx0XHR5aWVsZCBpdGVtO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGdldChrZXkpIHtcblx0XHRpZiAodGhpcy5jYWNoZS5oYXMoa2V5KSkge1xuXHRcdFx0Y29uc3QgaXRlbSA9IHRoaXMuY2FjaGUuZ2V0KGtleSk7XG5cblx0XHRcdHJldHVybiB0aGlzLl9nZXRJdGVtVmFsdWUoa2V5LCBpdGVtKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5vbGRDYWNoZS5oYXMoa2V5KSkge1xuXHRcdFx0Y29uc3QgaXRlbSA9IHRoaXMub2xkQ2FjaGUuZ2V0KGtleSk7XG5cdFx0XHRpZiAodGhpcy5fZGVsZXRlSWZFeHBpcmVkKGtleSwgaXRlbSkgPT09IGZhbHNlKSB7XG5cdFx0XHRcdHRoaXMuX21vdmVUb1JlY2VudChrZXksIGl0ZW0pO1xuXHRcdFx0XHRyZXR1cm4gaXRlbS52YWx1ZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRzZXQoa2V5LCB2YWx1ZSwge21heEFnZSA9IHRoaXMubWF4QWdlID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgPyB1bmRlZmluZWQgOiBEYXRlLm5vdygpICsgdGhpcy5tYXhBZ2V9ID0ge30pIHtcblx0XHRpZiAodGhpcy5jYWNoZS5oYXMoa2V5KSkge1xuXHRcdFx0dGhpcy5jYWNoZS5zZXQoa2V5LCB7XG5cdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRtYXhBZ2Vcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9zZXQoa2V5LCB7dmFsdWUsIGV4cGlyeTogbWF4QWdlfSk7XG5cdFx0fVxuXHR9XG5cblx0aGFzKGtleSkge1xuXHRcdGlmICh0aGlzLmNhY2hlLmhhcyhrZXkpKSB7XG5cdFx0XHRyZXR1cm4gIXRoaXMuX2RlbGV0ZUlmRXhwaXJlZChrZXksIHRoaXMuY2FjaGUuZ2V0KGtleSkpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLm9sZENhY2hlLmhhcyhrZXkpKSB7XG5cdFx0XHRyZXR1cm4gIXRoaXMuX2RlbGV0ZUlmRXhwaXJlZChrZXksIHRoaXMub2xkQ2FjaGUuZ2V0KGtleSkpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHBlZWsoa2V5KSB7XG5cdFx0aWYgKHRoaXMuY2FjaGUuaGFzKGtleSkpIHtcblx0XHRcdHJldHVybiB0aGlzLl9wZWVrKGtleSwgdGhpcy5jYWNoZSk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMub2xkQ2FjaGUuaGFzKGtleSkpIHtcblx0XHRcdHJldHVybiB0aGlzLl9wZWVrKGtleSwgdGhpcy5vbGRDYWNoZSk7XG5cdFx0fVxuXHR9XG5cblx0ZGVsZXRlKGtleSkge1xuXHRcdGNvbnN0IGRlbGV0ZWQgPSB0aGlzLmNhY2hlLmRlbGV0ZShrZXkpO1xuXHRcdGlmIChkZWxldGVkKSB7XG5cdFx0XHR0aGlzLl9zaXplLS07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMub2xkQ2FjaGUuZGVsZXRlKGtleSkgfHwgZGVsZXRlZDtcblx0fVxuXG5cdGNsZWFyKCkge1xuXHRcdHRoaXMuY2FjaGUuY2xlYXIoKTtcblx0XHR0aGlzLm9sZENhY2hlLmNsZWFyKCk7XG5cdFx0dGhpcy5fc2l6ZSA9IDA7XG5cdH1cblxuXHRyZXNpemUobmV3U2l6ZSkge1xuXHRcdGlmICghKG5ld1NpemUgJiYgbmV3U2l6ZSA+IDApKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdgbWF4U2l6ZWAgbXVzdCBiZSBhIG51bWJlciBncmVhdGVyIHRoYW4gMCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGl0ZW1zID0gWy4uLnRoaXMuX2VudHJpZXNBc2NlbmRpbmcoKV07XG5cdFx0Y29uc3QgcmVtb3ZlQ291bnQgPSBpdGVtcy5sZW5ndGggLSBuZXdTaXplO1xuXHRcdGlmIChyZW1vdmVDb3VudCA8IDApIHtcblx0XHRcdHRoaXMuY2FjaGUgPSBuZXcgTWFwKGl0ZW1zKTtcblx0XHRcdHRoaXMub2xkQ2FjaGUgPSBuZXcgTWFwKCk7XG5cdFx0XHR0aGlzLl9zaXplID0gaXRlbXMubGVuZ3RoO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAocmVtb3ZlQ291bnQgPiAwKSB7XG5cdFx0XHRcdHRoaXMuX2VtaXRFdmljdGlvbnMoaXRlbXMuc2xpY2UoMCwgcmVtb3ZlQ291bnQpKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5vbGRDYWNoZSA9IG5ldyBNYXAoaXRlbXMuc2xpY2UocmVtb3ZlQ291bnQpKTtcblx0XHRcdHRoaXMuY2FjaGUgPSBuZXcgTWFwKCk7XG5cdFx0XHR0aGlzLl9zaXplID0gMDtcblx0XHR9XG5cblx0XHR0aGlzLm1heFNpemUgPSBuZXdTaXplO1xuXHR9XG5cblx0KiBrZXlzKCkge1xuXHRcdGZvciAoY29uc3QgW2tleV0gb2YgdGhpcykge1xuXHRcdFx0eWllbGQga2V5O1xuXHRcdH1cblx0fVxuXG5cdCogdmFsdWVzKCkge1xuXHRcdGZvciAoY29uc3QgWywgdmFsdWVdIG9mIHRoaXMpIHtcblx0XHRcdHlpZWxkIHZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdCogW1N5bWJvbC5pdGVyYXRvcl0oKSB7XG5cdFx0Zm9yIChjb25zdCBpdGVtIG9mIHRoaXMuY2FjaGUpIHtcblx0XHRcdGNvbnN0IFtrZXksIHZhbHVlXSA9IGl0ZW07XG5cdFx0XHRjb25zdCBkZWxldGVkID0gdGhpcy5fZGVsZXRlSWZFeHBpcmVkKGtleSwgdmFsdWUpO1xuXHRcdFx0aWYgKGRlbGV0ZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRcdHlpZWxkIFtrZXksIHZhbHVlLnZhbHVlXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy5vbGRDYWNoZSkge1xuXHRcdFx0Y29uc3QgW2tleSwgdmFsdWVdID0gaXRlbTtcblx0XHRcdGlmICghdGhpcy5jYWNoZS5oYXMoa2V5KSkge1xuXHRcdFx0XHRjb25zdCBkZWxldGVkID0gdGhpcy5fZGVsZXRlSWZFeHBpcmVkKGtleSwgdmFsdWUpO1xuXHRcdFx0XHRpZiAoZGVsZXRlZCA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHR5aWVsZCBba2V5LCB2YWx1ZS52YWx1ZV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQqIGVudHJpZXNEZXNjZW5kaW5nKCkge1xuXHRcdGxldCBpdGVtcyA9IFsuLi50aGlzLmNhY2hlXTtcblx0XHRmb3IgKGxldCBpID0gaXRlbXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcblx0XHRcdGNvbnN0IGl0ZW0gPSBpdGVtc1tpXTtcblx0XHRcdGNvbnN0IFtrZXksIHZhbHVlXSA9IGl0ZW07XG5cdFx0XHRjb25zdCBkZWxldGVkID0gdGhpcy5fZGVsZXRlSWZFeHBpcmVkKGtleSwgdmFsdWUpO1xuXHRcdFx0aWYgKGRlbGV0ZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRcdHlpZWxkIFtrZXksIHZhbHVlLnZhbHVlXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpdGVtcyA9IFsuLi50aGlzLm9sZENhY2hlXTtcblx0XHRmb3IgKGxldCBpID0gaXRlbXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcblx0XHRcdGNvbnN0IGl0ZW0gPSBpdGVtc1tpXTtcblx0XHRcdGNvbnN0IFtrZXksIHZhbHVlXSA9IGl0ZW07XG5cdFx0XHRpZiAoIXRoaXMuY2FjaGUuaGFzKGtleSkpIHtcblx0XHRcdFx0Y29uc3QgZGVsZXRlZCA9IHRoaXMuX2RlbGV0ZUlmRXhwaXJlZChrZXksIHZhbHVlKTtcblx0XHRcdFx0aWYgKGRlbGV0ZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0eWllbGQgW2tleSwgdmFsdWUudmFsdWVdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0KiBlbnRyaWVzQXNjZW5kaW5nKCkge1xuXHRcdGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHRoaXMuX2VudHJpZXNBc2NlbmRpbmcoKSkge1xuXHRcdFx0eWllbGQgW2tleSwgdmFsdWUudmFsdWVdO1xuXHRcdH1cblx0fVxuXG5cdGdldCBzaXplKCkge1xuXHRcdGlmICghdGhpcy5fc2l6ZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMub2xkQ2FjaGUuc2l6ZTtcblx0XHR9XG5cblx0XHRsZXQgb2xkQ2FjaGVTaXplID0gMDtcblx0XHRmb3IgKGNvbnN0IGtleSBvZiB0aGlzLm9sZENhY2hlLmtleXMoKSkge1xuXHRcdFx0aWYgKCF0aGlzLmNhY2hlLmhhcyhrZXkpKSB7XG5cdFx0XHRcdG9sZENhY2hlU2l6ZSsrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBNYXRoLm1pbih0aGlzLl9zaXplICsgb2xkQ2FjaGVTaXplLCB0aGlzLm1heFNpemUpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgTGFuZ3VhZ2VUb29sUGx1Z2luIGZyb20gJy4nO1xuXG5leHBvcnQgaW50ZXJmYWNlIExhbmd1YWdlVG9vbFBsdWdpblNldHRpbmdzIHtcblx0c2hvdWxkQXV0b0NoZWNrOiBib29sZWFuO1xuXG5cdHNlcnZlclVybDogc3RyaW5nO1xuXHRnbGFzc0JnOiBib29sZWFuO1xuXHRhcGlrZXk/OiBzdHJpbmc7XG5cdHVzZXJuYW1lPzogc3RyaW5nO1xuXHRzdGF0aWNMYW5ndWFnZT86IHN0cmluZztcblxuXHRwaWNreU1vZGU6IGJvb2xlYW47XG5cblx0cnVsZU90aGVyQ2F0ZWdvcmllcz86IHN0cmluZztcblx0cnVsZU90aGVyUnVsZXM/OiBzdHJpbmc7XG5cdHJ1bGVPdGhlckRpc2FibGVkUnVsZXM/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBMYW5ndWFnZVRvb2xQbHVnaW5TZXR0aW5ncyA9IHtcblx0c2VydmVyVXJsOiAnaHR0cHM6Ly9hcGkubGFuZ3VhZ2V0b29sLm9yZycsXG5cdGdsYXNzQmc6IGZhbHNlLFxuXHRzaG91bGRBdXRvQ2hlY2s6IGZhbHNlLFxuXG5cdHBpY2t5TW9kZTogZmFsc2UsXG59O1xuXG5leHBvcnQgY2xhc3MgTGFuZ3VhZ2VUb29sU2V0dGluZ3NUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcblx0cHJpdmF0ZSByZWFkb25seSBwbHVnaW46IExhbmd1YWdlVG9vbFBsdWdpbjtcblx0cHJpdmF0ZSBsYW5ndWFnZXM6IHsgbmFtZTogc3RyaW5nOyBjb2RlOiBzdHJpbmc7IGxvbmdDb2RlOiBzdHJpbmcgfVtdO1xuXHRwdWJsaWMgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogTGFuZ3VhZ2VUb29sUGx1Z2luKSB7XG5cdFx0c3VwZXIoYXBwLCBwbHVnaW4pO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIHJlcXVlc3RMYW5ndWFnZXMoKSB7XG5cdFx0aWYgKHRoaXMubGFuZ3VhZ2VzKSByZXR1cm4gdGhpcy5sYW5ndWFnZXM7XG5cdFx0Y29uc3QgbGFuZ3VhZ2VzID0gYXdhaXQgZmV0Y2goYCR7dGhpcy5wbHVnaW4uc2V0dGluZ3Muc2VydmVyVXJsfS92Mi9sYW5ndWFnZXNgKS50aGVuKHJlcyA9PiByZXMuanNvbigpKTtcblx0XHR0aGlzLmxhbmd1YWdlcyA9IGxhbmd1YWdlcztcblx0XHRyZXR1cm4gdGhpcy5sYW5ndWFnZXM7XG5cdH1cblxuXHRwdWJsaWMgZGlzcGxheSgpOiB2b2lkIHtcblx0XHRjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuXG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcblxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogJ1NldHRpbmdzIGZvciBMYW5ndWFnZVRvb2wnIH0pO1xuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ0VuZHBvaW50Jylcblx0XHRcdC5zZXREZXNjKCdFbmRwb2ludCB0aGF0IHdpbGwgYmUgdXNlZCB0byBtYWtlIHJlcXVlc3RzIHRvJylcblx0XHRcdC50aGVuKHNldHRpbmcgPT4ge1xuXHRcdFx0XHRsZXQgaW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcblxuXHRcdFx0XHRzZXR0aW5nXG5cdFx0XHRcdFx0LmFkZFRleHQodGV4dCA9PiB7XG5cdFx0XHRcdFx0XHRpbnB1dCA9IHRleHQ7XG5cdFx0XHRcdFx0XHR0ZXh0XG5cdFx0XHRcdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignRW50ZXIgZW5kcG9pbnQnKVxuXHRcdFx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2VydmVyVXJsKVxuXHRcdFx0XHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNlcnZlclVybCA9IHZhbHVlLnJlcGxhY2UoL1xcL3YyXFwvY2hlY2tcXC8kLywgJycpLnJlcGxhY2UoL1xcLyQvLCAnJyk7XG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmFkZEV4dHJhQnV0dG9uKGJ1dHRvbiA9PiB7XG5cdFx0XHRcdFx0XHRidXR0b25cblx0XHRcdFx0XHRcdFx0LnNldEljb24oJ3Jlc2V0Jylcblx0XHRcdFx0XHRcdFx0LnNldFRvb2x0aXAoJ1Jlc2V0IHRvIGRlZmF1bHQnKVxuXHRcdFx0XHRcdFx0XHQub25DbGljayhhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc2VydmVyVXJsID0gREVGQVVMVF9TRVRUSU5HUy5zZXJ2ZXJVcmw7XG5cdFx0XHRcdFx0XHRcdFx0aW5wdXQ/LnNldFZhbHVlKERFRkFVTFRfU0VUVElOR1Muc2VydmVyVXJsKTtcblx0XHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCdBdXRvY2hlY2sgVGV4dCcpXG5cdFx0XHQuc2V0RGVzYygnQ2hlY2sgdGV4dCBhcyB5b3UgdHlwZScpXG5cdFx0XHQuYWRkVG9nZ2xlKGNvbXBvbmVudCA9PiB7XG5cdFx0XHRcdGNvbXBvbmVudC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG91bGRBdXRvQ2hlY2spLm9uQ2hhbmdlKGFzeW5jIHZhbHVlID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG91bGRBdXRvQ2hlY2sgPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCdHbGFzcyBCYWNrZ3JvdW5kJylcblx0XHRcdC5zZXREZXNjKCdVc2UgdGhlIHNlY29uZGFyeSBiYWNrZ3JvdW5kIGNvbG9yIG9mIHRoZSB0aGVtZSBvciBhIGdsYXNzIGJhY2tncm91bmQnKVxuXHRcdFx0LmFkZFRvZ2dsZShjb21wb25lbnQgPT4ge1xuXHRcdFx0XHRjb21wb25lbnQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2xhc3NCZykub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmdsYXNzQmcgPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCdTdGF0aWMgTGFuZ3VhZ2UnKVxuXHRcdFx0LnNldERlc2MoXG5cdFx0XHRcdCdTZXQgYSBzdGF0aWMgbGFuZ3VhZ2UgdGhhdCB3aWxsIGFsd2F5cyBiZSB1c2VkIChMYW5ndWFnZVRvb2wgdHJpZXMgdG8gYXV0byBkZXRlY3QgdGhlIGxhbmd1YWdlLCB0aGlzIGlzIHVzdWFsbHkgbm90IG5lY2Vzc2FyeSknLFxuXHRcdFx0KVxuXHRcdFx0LmFkZERyb3Bkb3duKGNvbXBvbmVudCA9PiB7XG5cdFx0XHRcdHRoaXMucmVxdWVzdExhbmd1YWdlcygpXG5cdFx0XHRcdFx0LnRoZW4obGFuZ3VhZ2VzID0+IHtcblx0XHRcdFx0XHRcdGNvbXBvbmVudC5hZGRPcHRpb24oJ2F1dG8nLCAnQXV0byBEZXRlY3QnKTtcblx0XHRcdFx0XHRcdGxhbmd1YWdlcy5mb3JFYWNoKHYgPT4gY29tcG9uZW50LmFkZE9wdGlvbih2LmxvbmdDb2RlLCB2Lm5hbWUpKTtcblx0XHRcdFx0XHRcdGNvbXBvbmVudC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdGF0aWNMYW5ndWFnZSA/PyAnYXV0bycpO1xuXHRcdFx0XHRcdFx0Y29tcG9uZW50Lm9uQ2hhbmdlKGFzeW5jIHZhbHVlID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc3RhdGljTGFuZ3VhZ2UgPSB2YWx1ZTtcblx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jYXRjaChjb25zb2xlLmVycm9yKTtcblx0XHRcdH0pO1xuXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiAnUnVsZSBDYXRlZ29yaWVzJyB9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ1BpY2t5IE1vZGUnKVxuXHRcdFx0LnNldERlc2MoXG5cdFx0XHRcdCdQcm92aWRlcyBtb3JlIHN0eWxlIGFuZCB0b25hbGl0eSBzdWdnZXN0aW9ucywgZGV0ZWN0cyBsb25nIG9yIGNvbXBsZXggc2VudGVuY2VzLCByZWNvZ25pemVzIGNvbGxvcXVpYWxpc20gYW5kIHJlZHVuZGFuY2llcywgcHJvYWN0aXZlbHkgc3VnZ2VzdHMgc3lub255bXMgZm9yIGNvbW1vbmx5IG92ZXJ1c2VkIHdvcmRzJyxcblx0XHRcdClcblx0XHRcdC5hZGRUb2dnbGUoY29tcG9uZW50ID0+IHtcblx0XHRcdFx0Y29tcG9uZW50LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnBpY2t5TW9kZSkub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnBpY2t5TW9kZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgnT3RoZXIgcnVsZSBjYXRlZ29yaWVzJylcblx0XHRcdC5zZXREZXNjKCdFbnRlciBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGNhdGVnb3JpZXMnKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PlxuXHRcdFx0XHR0ZXh0XG5cdFx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCdFZy4gQ0FURUdPUllfMSxDQVRFR09SWV8yJylcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucnVsZU90aGVyQ2F0ZWdvcmllcyB8fCAnJylcblx0XHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MucnVsZU90aGVyQ2F0ZWdvcmllcyA9IHZhbHVlLnJlcGxhY2UoL1xccysvZywgJycpO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHQudGhlbihzZXR0aW5nID0+IHtcblx0XHRcdFx0c2V0dGluZy5kZXNjRWwuY3JlYXRlRWwoJ2JyJyk7XG5cdFx0XHRcdHNldHRpbmcuZGVzY0VsLmNyZWF0ZUVsKFxuXHRcdFx0XHRcdCdhJyxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0ZXh0OiAnQ2xpY2sgaGVyZSBmb3IgYSBsaXN0IG9mIHJ1bGVzIGFuZCBjYXRlZ29yaWVzJyxcblx0XHRcdFx0XHRcdGhyZWY6ICdodHRwczovL2NvbW11bml0eS5sYW5ndWFnZXRvb2wub3JnL3J1bGUvbGlzdCcsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRhID0+IHtcblx0XHRcdFx0XHRcdGEuc2V0QXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdCk7XG5cdFx0XHR9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ0VuYWJsZSBTcGVjaWZpYyBSdWxlcycpXG5cdFx0XHQuc2V0RGVzYygnRW50ZXIgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBydWxlcycpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+XG5cdFx0XHRcdHRleHRcblx0XHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJ0VnLiBSVUxFXzEsUlVMRV8yJylcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucnVsZU90aGVyUnVsZXMgfHwgJycpXG5cdFx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jIHZhbHVlID0+IHtcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnJ1bGVPdGhlclJ1bGVzID0gdmFsdWUucmVwbGFjZSgvXFxzKy9nLCAnJyk7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdC50aGVuKHNldHRpbmcgPT4ge1xuXHRcdFx0XHRzZXR0aW5nLmRlc2NFbC5jcmVhdGVFbCgnYnInKTtcblx0XHRcdFx0c2V0dGluZy5kZXNjRWwuY3JlYXRlRWwoXG5cdFx0XHRcdFx0J2EnLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRleHQ6ICdDbGljayBoZXJlIGZvciBhIGxpc3Qgb2YgcnVsZXMgYW5kIGNhdGVnb3JpZXMnLFxuXHRcdFx0XHRcdFx0aHJlZjogJ2h0dHBzOi8vY29tbXVuaXR5Lmxhbmd1YWdldG9vbC5vcmcvcnVsZS9saXN0Jyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGEgPT4ge1xuXHRcdFx0XHRcdFx0YS5zZXRBdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgnRGlzYWJsZSBTcGVjaWZpYyBSdWxlcycpXG5cdFx0XHQuc2V0RGVzYygnRW50ZXIgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBydWxlcycpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+XG5cdFx0XHRcdHRleHRcblx0XHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJ0VnLiBSVUxFXzEsUlVMRV8yJylcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucnVsZU90aGVyRGlzYWJsZWRSdWxlcyB8fCAnJylcblx0XHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MucnVsZU90aGVyRGlzYWJsZWRSdWxlcyA9IHZhbHVlLnJlcGxhY2UoL1xccysvZywgJycpO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHQudGhlbihzZXR0aW5nID0+IHtcblx0XHRcdFx0c2V0dGluZy5kZXNjRWwuY3JlYXRlRWwoJ2JyJyk7XG5cdFx0XHRcdHNldHRpbmcuZGVzY0VsLmNyZWF0ZUVsKFxuXHRcdFx0XHRcdCdhJyxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0ZXh0OiAnQ2xpY2sgaGVyZSBmb3IgYSBsaXN0IG9mIHJ1bGVzIGFuZCBjYXRlZ29yaWVzJyxcblx0XHRcdFx0XHRcdGhyZWY6ICdodHRwczovL2NvbW11bml0eS5sYW5ndWFnZXRvb2wub3JnL3J1bGUvbGlzdCcsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRhID0+IHtcblx0XHRcdFx0XHRcdGEuc2V0QXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdCk7XG5cdFx0XHR9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ0FQSSBVc2VybmFtZScpXG5cdFx0XHQuc2V0RGVzYygnRW50ZXIgYSB1c2VybmFtZS9lbWFpbCBmb3IgQVBJIEFjY2VzcycpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+XG5cdFx0XHRcdHRleHRcblx0XHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJ3BldGVybHVzdGlnQGdtYWlsLmNvbScpXG5cdFx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZXJuYW1lIHx8ICcnKVxuXHRcdFx0XHRcdC5vbkNoYW5nZShhc3luYyB2YWx1ZSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VybmFtZSA9IHZhbHVlLnJlcGxhY2UoL1xccysvZywgJycpO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHQudGhlbihzZXR0aW5nID0+IHtcblx0XHRcdFx0c2V0dGluZy5kZXNjRWwuY3JlYXRlRWwoJ2JyJyk7XG5cdFx0XHRcdHNldHRpbmcuZGVzY0VsLmNyZWF0ZUVsKFxuXHRcdFx0XHRcdCdhJyxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0ZXh0OiAnQ2xpY2sgaGVyZSBmb3IgaW5mb3JtYXRpb24gYWJvdXQgUHJlbWl1bSBBY2Nlc3MnLFxuXHRcdFx0XHRcdFx0aHJlZjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9DbGVtZW5zLUUvb2JzaWRpYW4tbGFuZ3VhZ2V0b29sLXBsdWdpbiNwcmVtaXVtLWFjY291bnRzJyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGEgPT4ge1xuXHRcdFx0XHRcdFx0YS5zZXRBdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgnQVBJIEtleScpXG5cdFx0XHQuc2V0RGVzYygnRW50ZXIgYW4gQVBJIEtleScpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+XG5cdFx0XHRcdHRleHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXBpa2V5IHx8ICcnKS5vbkNoYW5nZShhc3luYyB2YWx1ZSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuYXBpa2V5ID0gdmFsdWUucmVwbGFjZSgvXFxzKy9nLCAnJyk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LnRoZW4oc2V0dGluZyA9PiB7XG5cdFx0XHRcdHNldHRpbmcuZGVzY0VsLmNyZWF0ZUVsKCdicicpO1xuXHRcdFx0XHRzZXR0aW5nLmRlc2NFbC5jcmVhdGVFbChcblx0XHRcdFx0XHQnYScsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGV4dDogJ0NsaWNrIGhlcmUgZm9yIGluZm9ybWF0aW9uIGFib3V0IFByZW1pdW0gQWNjZXNzJyxcblx0XHRcdFx0XHRcdGhyZWY6ICdodHRwczovL2dpdGh1Yi5jb20vQ2xlbWVucy1FL29ic2lkaWFuLWxhbmd1YWdldG9vbC1wbHVnaW4jcHJlbWl1bS1hY2NvdW50cycsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRhID0+IHtcblx0XHRcdFx0XHRcdGEuc2V0QXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdCk7XG5cdFx0XHR9KTtcblx0fVxufVxuIiwiaW1wb3J0IHsgTGFuZ3VhZ2VUb29sUGx1Z2luU2V0dGluZ3MgfSBmcm9tICcuL1NldHRpbmdzVGFiJztcblxuZXhwb3J0IGNvbnN0IGlnbm9yZUxpc3RSZWdFeCA9IC9mcm9udG1hdHRlcnxjb2RlfG1hdGh8dGVtcGxhdGVyfGJsb2NraWR8aGFzaHRhZ3xpbnRlcm5hbC87XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNoU3RyaW5nKHZhbHVlOiBzdHJpbmcpIHtcblx0bGV0IGhhc2ggPSAwO1xuXHRpZiAodmFsdWUubGVuZ3RoID09PSAwKSB7XG5cdFx0cmV0dXJuIGhhc2g7XG5cdH1cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IGNoYXIgPSB2YWx1ZS5jaGFyQ29kZUF0KGkpO1xuXHRcdGhhc2ggPSAoaGFzaCA8PCA1KSAtIGhhc2ggKyBjaGFyO1xuXHRcdGhhc2ggJj0gaGFzaDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG5cdH1cblx0cmV0dXJuIGhhc2g7XG59XG5cbi8vIEFzc2lnbiBhIENTUyBjbGFzcyBiYXNlZCBvbiBhIHJ1bGUncyBjYXRlZ29yeSBJRFxuZXhwb3J0IGZ1bmN0aW9uIGdldElzc3VlVHlwZUNsYXNzTmFtZShjYXRlZ29yeUlkOiBzdHJpbmcpIHtcblx0c3dpdGNoIChjYXRlZ29yeUlkKSB7XG5cdFx0Y2FzZSAnQ09MTE9RVUlBTElTTVMnOlxuXHRcdGNhc2UgJ1JFRFVOREFOQ1knOlxuXHRcdGNhc2UgJ1NUWUxFJzpcblx0XHRcdHJldHVybiAnbHQtc3R5bGUnO1xuXHRcdGNhc2UgJ1BVTkNUVUFUSU9OJzpcblx0XHRjYXNlICdUWVBPUyc6XG5cdFx0XHRyZXR1cm4gJ2x0LW1ham9yJztcblx0fVxuXG5cdHJldHVybiAnbHQtbWlub3InO1xufVxuXG4vLyBDb25zdHJ1Y3QgYSBsaXN0IG9mIGVuYWJsZWQgLyBkaXNhYmxlZCBydWxlc1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJ1bGVDYXRlZ29yaWVzKHNldHRpbmdzOiBMYW5ndWFnZVRvb2xQbHVnaW5TZXR0aW5ncykge1xuXHRjb25zdCBlbmFibGVkQ2F0ZWdvcmllczogc3RyaW5nW10gPSBzZXR0aW5ncy5ydWxlT3RoZXJDYXRlZ29yaWVzID8gc2V0dGluZ3MucnVsZU90aGVyQ2F0ZWdvcmllcy5zcGxpdCgnLCcpIDogW107XG5cdGNvbnN0IGRpc2FibGVkQ2F0ZWdvcmllczogc3RyaW5nW10gPSBzZXR0aW5ncy5ydWxlT3RoZXJEaXNhYmxlZFJ1bGVzXG5cdFx0PyBzZXR0aW5ncy5ydWxlT3RoZXJEaXNhYmxlZFJ1bGVzLnNwbGl0KCcsJylcblx0XHQ6IFtdO1xuXG5cdHJldHVybiB7XG5cdFx0ZW5hYmxlZENhdGVnb3JpZXMsXG5cdFx0ZGlzYWJsZWRDYXRlZ29yaWVzLFxuXHR9O1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHRzID0gZXhwb3J0cy5jb21wb3NlYW5ub3RhdGlvbiA9IGV4cG9ydHMuY29sbGVjdHRleHRub2RlcyA9IGV4cG9ydHMuYnVpbGQgPSB2b2lkIDA7XG5jb25zdCBkZWZhdWx0cyA9IHtcbiAgICBjaGlsZHJlbihub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlLmNoaWxkcmVuO1xuICAgIH0sXG4gICAgYW5ub3RhdGV0ZXh0bm9kZShub2RlLCB0ZXh0KSB7XG4gICAgICAgIGlmIChub2RlLnR5cGUgPT09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG9mZnNldDoge1xuICAgICAgICAgICAgICAgICAgICBlbmQ6IG5vZGUucG9zaXRpb24uZW5kLm9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IG5vZGUucG9zaXRpb24uc3RhcnQub2Zmc2V0LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGV4dDogdGV4dC5zdWJzdHJpbmcobm9kZS5wb3NpdGlvbi5zdGFydC5vZmZzZXQsIG5vZGUucG9zaXRpb24uZW5kLm9mZnNldCksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGludGVycHJldG1hcmt1cCh0ZXh0ID0gXCJcIikge1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9LFxufTtcbmV4cG9ydHMuZGVmYXVsdHMgPSBkZWZhdWx0cztcbmZ1bmN0aW9uIGNvbGxlY3R0ZXh0bm9kZXMoYXN0LCB0ZXh0LCBvcHRpb25zID0gZGVmYXVsdHMpIHtcbiAgICBjb25zdCB0ZXh0YW5ub3RhdGlvbnMgPSBbXTtcbiAgICBmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcbiAgICAgICAgY29uc3QgYW5ub3RhdGlvbiA9IG9wdGlvbnMuYW5ub3RhdGV0ZXh0bm9kZShub2RlLCB0ZXh0KTtcbiAgICAgICAgaWYgKGFubm90YXRpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRleHRhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gb3B0aW9ucy5jaGlsZHJlbihub2RlKTtcbiAgICAgICAgaWYgKGNoaWxkcmVuICE9PSBudWxsICYmIEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICBjaGlsZHJlbi5mb3JFYWNoKHJlY3Vyc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlY3Vyc2UoYXN0KTtcbiAgICByZXR1cm4gdGV4dGFubm90YXRpb25zO1xufVxuZXhwb3J0cy5jb2xsZWN0dGV4dG5vZGVzID0gY29sbGVjdHRleHRub2RlcztcbmZ1bmN0aW9uIGNvbXBvc2Vhbm5vdGF0aW9uKHRleHQsIGFubm90YXRlZHRleHRub2Rlcywgb3B0aW9ucyA9IGRlZmF1bHRzKSB7XG4gICAgY29uc3QgYW5ub3RhdGlvbnMgPSBbXTtcbiAgICBsZXQgcHJpb3IgPSB7XG4gICAgICAgIG9mZnNldDoge1xuICAgICAgICAgICAgZW5kOiAwLFxuICAgICAgICAgICAgc3RhcnQ6IDAsXG4gICAgICAgIH0sXG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgYW5ub3RhdGVkdGV4dG5vZGVzKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnR0ZXh0ID0gdGV4dC5zdWJzdHJpbmcocHJpb3Iub2Zmc2V0LmVuZCwgY3VycmVudC5vZmZzZXQuc3RhcnQpO1xuICAgICAgICBhbm5vdGF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIGludGVycHJldEFzOiBvcHRpb25zLmludGVycHJldG1hcmt1cChjdXJyZW50dGV4dCksXG4gICAgICAgICAgICBtYXJrdXA6IGN1cnJlbnR0ZXh0LFxuICAgICAgICAgICAgb2Zmc2V0OiB7XG4gICAgICAgICAgICAgICAgZW5kOiBjdXJyZW50Lm9mZnNldC5zdGFydCxcbiAgICAgICAgICAgICAgICBzdGFydDogcHJpb3Iub2Zmc2V0LmVuZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICBhbm5vdGF0aW9ucy5wdXNoKGN1cnJlbnQpO1xuICAgICAgICBwcmlvciA9IGN1cnJlbnQ7XG4gICAgfVxuICAgIC8vIEFsd2F5cyBhZGQgYSBmaW5hbCBtYXJrdXAgbm9kZSB0byBlc251cmUgdHJhaWxpbmcgd2hpdGVzcGFjZSBpcyBhZGRlZC5cbiAgICBjb25zdCBmaW5hbHRleHQgPSB0ZXh0LnN1YnN0cmluZyhwcmlvci5vZmZzZXQuZW5kLCB0ZXh0Lmxlbmd0aCk7XG4gICAgYW5ub3RhdGlvbnMucHVzaCh7XG4gICAgICAgIGludGVycHJldEFzOiBvcHRpb25zLmludGVycHJldG1hcmt1cChmaW5hbHRleHQpLFxuICAgICAgICBtYXJrdXA6IGZpbmFsdGV4dCxcbiAgICAgICAgb2Zmc2V0OiB7XG4gICAgICAgICAgICBlbmQ6IHRleHQubGVuZ3RoLFxuICAgICAgICAgICAgc3RhcnQ6IHByaW9yLm9mZnNldC5lbmQsXG4gICAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIHsgYW5ub3RhdGlvbjogYW5ub3RhdGlvbnMgfTtcbn1cbmV4cG9ydHMuY29tcG9zZWFubm90YXRpb24gPSBjb21wb3NlYW5ub3RhdGlvbjtcbmZ1bmN0aW9uIGJ1aWxkKHRleHQsIHBhcnNlLCBvcHRpb25zID0gZGVmYXVsdHMpIHtcbiAgICBjb25zdCBub2RlcyA9IHBhcnNlKHRleHQpO1xuICAgIGNvbnN0IHRleHRub2RlcyA9IGNvbGxlY3R0ZXh0bm9kZXMobm9kZXMsIHRleHQsIG9wdGlvbnMpO1xuICAgIHJldHVybiBjb21wb3NlYW5ub3RhdGlvbih0ZXh0LCB0ZXh0bm9kZXMsIG9wdGlvbnMpO1xufVxuZXhwb3J0cy5idWlsZCA9IGJ1aWxkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiLy9cbi8vIGZvcm1hdCAtIHByaW50Zi1saWtlIHN0cmluZyBmb3JtYXR0aW5nIGZvciBKYXZhU2NyaXB0XG4vLyBnaXRodWIuY29tL3NhbXNvbmpzL2Zvcm1hdFxuLy8gQF9zanNcbi8vXG4vLyBDb3B5cmlnaHQgMjAxMCAtIDIwMTMgU2FtaSBTYW1odXJpIDxzYW1pQHNhbWh1cmkubmV0PlxuLy9cbi8vIE1JVCBMaWNlbnNlXG4vLyBodHRwOi8vc2pzLm1pdC1saWNlbnNlLm9yZ1xuLy9cblxuOyhmdW5jdGlvbigpIHtcblxuICAvLy8vIEV4cG9ydCB0aGUgQVBJXG4gIHZhciBuYW1lc3BhY2U7XG5cbiAgLy8gQ29tbW9uSlMgLyBOb2RlIG1vZHVsZVxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBuYW1lc3BhY2UgPSBtb2R1bGUuZXhwb3J0cyA9IGZvcm1hdDtcbiAgfVxuXG4gIC8vIEJyb3dzZXJzIGFuZCBvdGhlciBlbnZpcm9ubWVudHNcbiAgZWxzZSB7XG4gICAgLy8gR2V0IHRoZSBnbG9iYWwgb2JqZWN0LiBXb3JrcyBpbiBFUzMsIEVTNSwgYW5kIEVTNSBzdHJpY3QgbW9kZS5cbiAgICBuYW1lc3BhY2UgPSAoZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMgfHwgKDEsZXZhbCkoJ3RoaXMnKSB9KCkpO1xuICB9XG5cbiAgbmFtZXNwYWNlLmZvcm1hdCA9IGZvcm1hdDtcbiAgbmFtZXNwYWNlLnZzcHJpbnRmID0gdnNwcmludGY7XG5cbiAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgY29uc29sZS5sb2cgPT09ICdmdW5jdGlvbicpIHtcbiAgICBuYW1lc3BhY2UucHJpbnRmID0gcHJpbnRmO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJpbnRmKC8qIC4uLiAqLykge1xuICAgIGNvbnNvbGUubG9nKGZvcm1hdC5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHZzcHJpbnRmKGZtdCwgcmVwbGFjZW1lbnRzKSB7XG4gICAgcmV0dXJuIGZvcm1hdC5hcHBseShudWxsLCBbZm10XS5jb25jYXQocmVwbGFjZW1lbnRzKSk7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXQoZm10KSB7XG4gICAgdmFyIGFyZ0luZGV4ID0gMSAvLyBza2lwIGluaXRpYWwgZm9ybWF0IGFyZ3VtZW50XG4gICAgICAsIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICwgaSA9IDBcbiAgICAgICwgbiA9IGZtdC5sZW5ndGhcbiAgICAgICwgcmVzdWx0ID0gJydcbiAgICAgICwgY1xuICAgICAgLCBlc2NhcGVkID0gZmFsc2VcbiAgICAgICwgYXJnXG4gICAgICAsIHRtcFxuICAgICAgLCBsZWFkaW5nWmVybyA9IGZhbHNlXG4gICAgICAsIHByZWNpc2lvblxuICAgICAgLCBuZXh0QXJnID0gZnVuY3Rpb24oKSB7IHJldHVybiBhcmdzW2FyZ0luZGV4KytdOyB9XG4gICAgICAsIHNsdXJwTnVtYmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGRpZ2l0cyA9ICcnO1xuICAgICAgICAgIHdoaWxlICgvXFxkLy50ZXN0KGZtdFtpXSkpIHtcbiAgICAgICAgICAgIGRpZ2l0cyArPSBmbXRbaSsrXTtcbiAgICAgICAgICAgIGMgPSBmbXRbaV07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkaWdpdHMubGVuZ3RoID4gMCA/IHBhcnNlSW50KGRpZ2l0cykgOiBudWxsO1xuICAgICAgICB9XG4gICAgICA7XG4gICAgZm9yICg7IGkgPCBuOyArK2kpIHtcbiAgICAgIGMgPSBmbXRbaV07XG4gICAgICBpZiAoZXNjYXBlZCkge1xuICAgICAgICBlc2NhcGVkID0gZmFsc2U7XG4gICAgICAgIGlmIChjID09ICcuJykge1xuICAgICAgICAgIGxlYWRpbmdaZXJvID0gZmFsc2U7XG4gICAgICAgICAgYyA9IGZtdFsrK2ldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPT0gJzAnICYmIGZtdFtpICsgMV0gPT0gJy4nKSB7XG4gICAgICAgICAgbGVhZGluZ1plcm8gPSB0cnVlO1xuICAgICAgICAgIGkgKz0gMjtcbiAgICAgICAgICBjID0gZm10W2ldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGxlYWRpbmdaZXJvID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBwcmVjaXNpb24gPSBzbHVycE51bWJlcigpO1xuICAgICAgICBzd2l0Y2ggKGMpIHtcbiAgICAgICAgY2FzZSAnYic6IC8vIG51bWJlciBpbiBiaW5hcnlcbiAgICAgICAgICByZXN1bHQgKz0gcGFyc2VJbnQobmV4dEFyZygpLCAxMCkudG9TdHJpbmcoMik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2MnOiAvLyBjaGFyYWN0ZXJcbiAgICAgICAgICBhcmcgPSBuZXh0QXJnKCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8IGFyZyBpbnN0YW5jZW9mIFN0cmluZylcbiAgICAgICAgICAgIHJlc3VsdCArPSBhcmc7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQoYXJnLCAxMCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkJzogLy8gbnVtYmVyIGluIGRlY2ltYWxcbiAgICAgICAgICByZXN1bHQgKz0gcGFyc2VJbnQobmV4dEFyZygpLCAxMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2YnOiAvLyBmbG9hdGluZyBwb2ludCBudW1iZXJcbiAgICAgICAgICB0bXAgPSBTdHJpbmcocGFyc2VGbG9hdChuZXh0QXJnKCkpLnRvRml4ZWQocHJlY2lzaW9uIHx8IDYpKTtcbiAgICAgICAgICByZXN1bHQgKz0gbGVhZGluZ1plcm8gPyB0bXAgOiB0bXAucmVwbGFjZSgvXjAvLCAnJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2onOiAvLyBKU09OXG4gICAgICAgICAgcmVzdWx0ICs9IEpTT04uc3RyaW5naWZ5KG5leHRBcmcoKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ28nOiAvLyBudW1iZXIgaW4gb2N0YWxcbiAgICAgICAgICByZXN1bHQgKz0gJzAnICsgcGFyc2VJbnQobmV4dEFyZygpLCAxMCkudG9TdHJpbmcoOCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3MnOiAvLyBzdHJpbmdcbiAgICAgICAgICByZXN1bHQgKz0gbmV4dEFyZygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd4JzogLy8gbG93ZXJjYXNlIGhleGFkZWNpbWFsXG4gICAgICAgICAgcmVzdWx0ICs9ICcweCcgKyBwYXJzZUludChuZXh0QXJnKCksIDEwKS50b1N0cmluZygxNik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1gnOiAvLyB1cHBlcmNhc2UgaGV4YWRlY2ltYWxcbiAgICAgICAgICByZXN1bHQgKz0gJzB4JyArIHBhcnNlSW50KG5leHRBcmcoKSwgMTApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlc3VsdCArPSBjO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGMgPT09ICclJykge1xuICAgICAgICBlc2NhcGVkID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCArPSBjO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbn0oKSk7XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGZvcm1hdHRlciA9IHJlcXVpcmUoJ2Zvcm1hdCcpXG5cbnZhciBmYXVsdCA9IGNyZWF0ZShFcnJvcilcblxubW9kdWxlLmV4cG9ydHMgPSBmYXVsdFxuXG5mYXVsdC5ldmFsID0gY3JlYXRlKEV2YWxFcnJvcilcbmZhdWx0LnJhbmdlID0gY3JlYXRlKFJhbmdlRXJyb3IpXG5mYXVsdC5yZWZlcmVuY2UgPSBjcmVhdGUoUmVmZXJlbmNlRXJyb3IpXG5mYXVsdC5zeW50YXggPSBjcmVhdGUoU3ludGF4RXJyb3IpXG5mYXVsdC50eXBlID0gY3JlYXRlKFR5cGVFcnJvcilcbmZhdWx0LnVyaSA9IGNyZWF0ZShVUklFcnJvcilcblxuZmF1bHQuY3JlYXRlID0gY3JlYXRlXG5cbi8vIENyZWF0ZSBhIG5ldyBgRUNvbnN0cnVjdG9yYCwgd2l0aCB0aGUgZm9ybWF0dGVkIGBmb3JtYXRgIGFzIGEgZmlyc3QgYXJndW1lbnQuXG5mdW5jdGlvbiBjcmVhdGUoRUNvbnN0cnVjdG9yKSB7XG4gIEZvcm1hdHRlZEVycm9yLmRpc3BsYXlOYW1lID0gRUNvbnN0cnVjdG9yLmRpc3BsYXlOYW1lIHx8IEVDb25zdHJ1Y3Rvci5uYW1lXG5cbiAgcmV0dXJuIEZvcm1hdHRlZEVycm9yXG5cbiAgZnVuY3Rpb24gRm9ybWF0dGVkRXJyb3IoZm9ybWF0KSB7XG4gICAgaWYgKGZvcm1hdCkge1xuICAgICAgZm9ybWF0ID0gZm9ybWF0dGVyLmFwcGx5KG51bGwsIGFyZ3VtZW50cylcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEVDb25zdHJ1Y3Rvcihmb3JtYXQpXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gbWF0dGVyc1xuXG52YXIgZmF1bHQgPSByZXF1aXJlKCdmYXVsdCcpXG5cbnZhciBvd24gPSB7fS5oYXNPd25Qcm9wZXJ0eVxuXG52YXIgbWFya2VycyA9IHt5YW1sOiAnLScsIHRvbWw6ICcrJ31cblxuZnVuY3Rpb24gbWF0dGVycyhvcHRpb25zKSB7XG4gIHZhciBzZXR0aW5ncyA9IG9wdGlvbnMgfHwgJ3lhbWwnXG4gIHZhciByZXN1bHRzID0gW11cbiAgdmFyIGluZGV4ID0gLTFcbiAgdmFyIGxlbmd0aFxuXG4gIC8vIE9uZSBwcmVzZXQgb3IgbWF0dGVyLlxuICBpZiAodHlwZW9mIHNldHRpbmdzID09PSAnc3RyaW5nJyB8fCAhKCdsZW5ndGgnIGluIHNldHRpbmdzKSkge1xuICAgIHNldHRpbmdzID0gW3NldHRpbmdzXVxuICB9XG5cbiAgbGVuZ3RoID0gc2V0dGluZ3MubGVuZ3RoXG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRzW2luZGV4XSA9IG1hdHRlcihzZXR0aW5nc1tpbmRleF0pXG4gIH1cblxuICByZXR1cm4gcmVzdWx0c1xufVxuXG5mdW5jdGlvbiBtYXR0ZXIob3B0aW9uKSB7XG4gIHZhciByZXN1bHQgPSBvcHRpb25cblxuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAoIW93bi5jYWxsKG1hcmtlcnMsIHJlc3VsdCkpIHtcbiAgICAgIHRocm93IGZhdWx0KCdNaXNzaW5nIG1hdHRlciBkZWZpbml0aW9uIGZvciBgJXNgJywgcmVzdWx0KVxuICAgIH1cblxuICAgIHJlc3VsdCA9IHt0eXBlOiByZXN1bHQsIG1hcmtlcjogbWFya2Vyc1tyZXN1bHRdfVxuICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgZmF1bHQoJ0V4cGVjdGVkIG1hdHRlciB0byBiZSBhbiBvYmplY3QsIG5vdCBgJWpgJywgcmVzdWx0KVxuICB9XG5cbiAgaWYgKCFvd24uY2FsbChyZXN1bHQsICd0eXBlJykpIHtcbiAgICB0aHJvdyBmYXVsdCgnTWlzc2luZyBgdHlwZWAgaW4gbWF0dGVyIGAlamAnLCByZXN1bHQpXG4gIH1cblxuICBpZiAoIW93bi5jYWxsKHJlc3VsdCwgJ2ZlbmNlJykgJiYgIW93bi5jYWxsKHJlc3VsdCwgJ21hcmtlcicpKSB7XG4gICAgdGhyb3cgZmF1bHQoJ01pc3NpbmcgYG1hcmtlcmAgb3IgYGZlbmNlYCBpbiBtYXR0ZXIgYCVqYCcsIHJlc3VsdClcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gY3JlYXRlXG5cbnZhciBtYXR0ZXJzID0gcmVxdWlyZSgnLi9tYXR0ZXJzJylcblxuZnVuY3Rpb24gY3JlYXRlKG9wdGlvbnMpIHtcbiAgdmFyIHNldHRpbmdzID0gbWF0dGVycyhvcHRpb25zKVxuICB2YXIgbGVuZ3RoID0gc2V0dGluZ3MubGVuZ3RoXG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciBmbG93ID0ge31cbiAgdmFyIG1hdHRlclxuICB2YXIgY29kZVxuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgbWF0dGVyID0gc2V0dGluZ3NbaW5kZXhdXG4gICAgY29kZSA9IGZlbmNlKG1hdHRlciwgJ29wZW4nKS5jaGFyQ29kZUF0KDApXG4gICAgaWYgKGNvZGUgaW4gZmxvdykge1xuICAgICAgZmxvd1tjb2RlXS5wdXNoKHBhcnNlKG1hdHRlcikpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZsb3dbY29kZV0gPSBbcGFyc2UobWF0dGVyKV1cbiAgICB9XG4gIH1cblxuICByZXR1cm4ge2Zsb3c6IGZsb3d9XG59XG5cbmZ1bmN0aW9uIHBhcnNlKG1hdHRlcikge1xuICB2YXIgbmFtZSA9IG1hdHRlci50eXBlXG4gIHZhciBhbnl3aGVyZSA9IG1hdHRlci5hbnl3aGVyZVxuICB2YXIgdmFsdWVUeXBlID0gbmFtZSArICdWYWx1ZSdcbiAgdmFyIGZlbmNlVHlwZSA9IG5hbWUgKyAnRmVuY2UnXG4gIHZhciBzZXF1ZW5jZVR5cGUgPSBmZW5jZVR5cGUgKyAnU2VxdWVuY2UnXG4gIHZhciBmZW5jZUNvbnN0cnVjdCA9IHt0b2tlbml6ZTogdG9rZW5pemVGZW5jZSwgcGFydGlhbDogdHJ1ZX1cbiAgdmFyIGJ1ZmZlclxuXG4gIHJldHVybiB7dG9rZW5pemU6IHRva2VuaXplRnJvbnRtYXR0ZXIsIGNvbmNyZXRlOiB0cnVlfVxuXG4gIGZ1bmN0aW9uIHRva2VuaXplRnJvbnRtYXR0ZXIoZWZmZWN0cywgb2ssIG5vaykge1xuICAgIHZhciBzZWxmID0gdGhpc1xuXG4gICAgcmV0dXJuIHN0YXJ0XG5cbiAgICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgICB2YXIgcG9zaXRpb24gPSBzZWxmLm5vdygpXG5cbiAgICAgIGlmIChwb3NpdGlvbi5jb2x1bW4gIT09IDEgfHwgKCFhbnl3aGVyZSAmJiBwb3NpdGlvbi5saW5lICE9PSAxKSkge1xuICAgICAgICByZXR1cm4gbm9rKGNvZGUpXG4gICAgICB9XG5cbiAgICAgIGVmZmVjdHMuZW50ZXIobmFtZSlcbiAgICAgIGJ1ZmZlciA9IGZlbmNlKG1hdHRlciwgJ29wZW4nKVxuICAgICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChmZW5jZUNvbnN0cnVjdCwgYWZ0ZXJPcGVuaW5nRmVuY2UsIG5vaykoY29kZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZnRlck9wZW5pbmdGZW5jZShjb2RlKSB7XG4gICAgICBidWZmZXIgPSBmZW5jZShtYXR0ZXIsICdjbG9zZScpXG4gICAgICByZXR1cm4gbGluZUVuZChjb2RlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpbmVTdGFydChjb2RlKSB7XG4gICAgICBpZiAoY29kZSA9PT0gLTUgfHwgY29kZSA9PT0gLTQgfHwgY29kZSA9PT0gLTMgfHwgY29kZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbGluZUVuZChjb2RlKVxuICAgICAgfVxuXG4gICAgICBlZmZlY3RzLmVudGVyKHZhbHVlVHlwZSlcbiAgICAgIHJldHVybiBsaW5lRGF0YShjb2RlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpbmVEYXRhKGNvZGUpIHtcbiAgICAgIGlmIChjb2RlID09PSAtNSB8fCBjb2RlID09PSAtNCB8fCBjb2RlID09PSAtMyB8fCBjb2RlID09PSBudWxsKSB7XG4gICAgICAgIGVmZmVjdHMuZXhpdCh2YWx1ZVR5cGUpXG4gICAgICAgIHJldHVybiBsaW5lRW5kKGNvZGUpXG4gICAgICB9XG5cbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGxpbmVEYXRhXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGluZUVuZChjb2RlKSB7XG4gICAgICAvLyBSZXF1aXJlIGEgY2xvc2luZyBmZW5jZS5cbiAgICAgIGlmIChjb2RlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub2soY29kZSlcbiAgICAgIH1cblxuICAgICAgLy8gQ2FuIG9ubHkgYmUgYW4gZW9sLlxuICAgICAgZWZmZWN0cy5lbnRlcignbGluZUVuZGluZycpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdCgnbGluZUVuZGluZycpXG4gICAgICByZXR1cm4gZWZmZWN0cy5hdHRlbXB0KGZlbmNlQ29uc3RydWN0LCBhZnRlciwgbGluZVN0YXJ0KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFmdGVyKGNvZGUpIHtcbiAgICAgIGVmZmVjdHMuZXhpdChuYW1lKVxuICAgICAgcmV0dXJuIG9rKGNvZGUpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW5pemVGZW5jZShlZmZlY3RzLCBvaywgbm9rKSB7XG4gICAgdmFyIGJ1ZmZlckluZGV4ID0gMFxuXG4gICAgcmV0dXJuIHN0YXJ0XG5cbiAgICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgICBpZiAoY29kZSA9PT0gYnVmZmVyLmNoYXJDb2RlQXQoYnVmZmVySW5kZXgpKSB7XG4gICAgICAgIGVmZmVjdHMuZW50ZXIoZmVuY2VUeXBlKVxuICAgICAgICBlZmZlY3RzLmVudGVyKHNlcXVlbmNlVHlwZSlcbiAgICAgICAgcmV0dXJuIGluc2lkZVNlcXVlbmNlKGNvZGUpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnNpZGVTZXF1ZW5jZShjb2RlKSB7XG4gICAgICBpZiAoYnVmZmVySW5kZXggPT09IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgZWZmZWN0cy5leGl0KHNlcXVlbmNlVHlwZSlcblxuICAgICAgICBpZiAoY29kZSA9PT0gLTIgfHwgY29kZSA9PT0gLTEgfHwgY29kZSA9PT0gMzIpIHtcbiAgICAgICAgICBlZmZlY3RzLmVudGVyKCd3aGl0ZXNwYWNlJylcbiAgICAgICAgICByZXR1cm4gaW5zaWRlV2hpdGVzcGFjZShjb2RlKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZlbmNlRW5kKGNvZGUpXG4gICAgICB9XG5cbiAgICAgIGlmIChjb2RlID09PSBidWZmZXIuY2hhckNvZGVBdChidWZmZXJJbmRleCkpIHtcbiAgICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICAgIGJ1ZmZlckluZGV4KytcbiAgICAgICAgcmV0dXJuIGluc2lkZVNlcXVlbmNlXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnNpZGVXaGl0ZXNwYWNlKGNvZGUpIHtcbiAgICAgIGlmIChjb2RlID09PSAtMiB8fCBjb2RlID09PSAtMSB8fCBjb2RlID09PSAzMikge1xuICAgICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgICAgcmV0dXJuIGluc2lkZVdoaXRlc3BhY2VcbiAgICAgIH1cblxuICAgICAgZWZmZWN0cy5leGl0KCd3aGl0ZXNwYWNlJylcbiAgICAgIHJldHVybiBmZW5jZUVuZChjb2RlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZlbmNlRW5kKGNvZGUpIHtcbiAgICAgIGlmIChjb2RlID09PSAtNSB8fCBjb2RlID09PSAtNCB8fCBjb2RlID09PSAtMyB8fCBjb2RlID09PSBudWxsKSB7XG4gICAgICAgIGVmZmVjdHMuZXhpdChmZW5jZVR5cGUpXG4gICAgICAgIHJldHVybiBvayhjb2RlKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbm9rKGNvZGUpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGZlbmNlKG1hdHRlciwgcHJvcCkge1xuICB2YXIgbWFya2VyXG5cbiAgaWYgKG1hdHRlci5tYXJrZXIpIHtcbiAgICBtYXJrZXIgPSBwaWNrKG1hdHRlci5tYXJrZXIsIHByb3ApXG4gICAgcmV0dXJuIG1hcmtlciArIG1hcmtlciArIG1hcmtlclxuICB9XG5cbiAgcmV0dXJuIHBpY2sobWF0dGVyLmZlbmNlLCBwcm9wKVxufVxuXG5mdW5jdGlvbiBwaWNrKHNjaGVtYSwgcHJvcCkge1xuICByZXR1cm4gdHlwZW9mIHNjaGVtYSA9PT0gJ3N0cmluZycgPyBzY2hlbWEgOiBzY2hlbWFbcHJvcF1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvc3ludGF4JylcbiIsIm1vZHVsZS5leHBvcnRzID0gY3JlYXRlRnJvbU1hcmtkb3duXG5cbnZhciBtYXR0ZXJzID0gcmVxdWlyZSgnbWljcm9tYXJrLWV4dGVuc2lvbi1mcm9udG1hdHRlci9saWIvbWF0dGVycycpXG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21NYXJrZG93bihvcHRpb25zKSB7XG4gIHZhciBzZXR0aW5ncyA9IG1hdHRlcnMob3B0aW9ucylcbiAgdmFyIGxlbmd0aCA9IHNldHRpbmdzLmxlbmd0aFxuICB2YXIgaW5kZXggPSAtMVxuICB2YXIgZW50ZXIgPSB7fVxuICB2YXIgZXhpdCA9IHt9XG4gIHZhciBtYXR0ZXJcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIG1hdHRlciA9IHNldHRpbmdzW2luZGV4XVxuICAgIGVudGVyW21hdHRlci50eXBlXSA9IG9wZW5lcihtYXR0ZXIpXG4gICAgZXhpdFttYXR0ZXIudHlwZV0gPSBjbG9zZVxuICAgIGV4aXRbbWF0dGVyLnR5cGUgKyAnVmFsdWUnXSA9IHZhbHVlXG4gIH1cblxuICByZXR1cm4ge2VudGVyOiBlbnRlciwgZXhpdDogZXhpdH1cbn1cblxuZnVuY3Rpb24gb3BlbmVyKG1hdHRlcikge1xuICByZXR1cm4gb3BlblxuICBmdW5jdGlvbiBvcGVuKHRva2VuKSB7XG4gICAgdGhpcy5lbnRlcih7dHlwZTogbWF0dGVyLnR5cGUsIHZhbHVlOiAnJ30sIHRva2VuKVxuICAgIHRoaXMuYnVmZmVyKClcbiAgfVxufVxuXG5mdW5jdGlvbiBjbG9zZSh0b2tlbikge1xuICB2YXIgZGF0YSA9IHRoaXMucmVzdW1lKClcbiAgLy8gUmVtb3ZlIHRoZSBpbml0aWFsIGFuZCBmaW5hbCBlb2wuXG4gIHRoaXMuZXhpdCh0b2tlbikudmFsdWUgPSBkYXRhLnJlcGxhY2UoL14oXFxyP1xcbnxcXHIpfChcXHI/XFxufFxccikkL2csICcnKVxufVxuXG5mdW5jdGlvbiB2YWx1ZSh0b2tlbikge1xuICB0aGlzLmNvbmZpZy5lbnRlci5kYXRhLmNhbGwodGhpcywgdG9rZW4pXG4gIHRoaXMuY29uZmlnLmV4aXQuZGF0YS5jYWxsKHRoaXMsIHRva2VuKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVUb01hcmtkb3duXG5cbnZhciBtYXR0ZXJzID0gcmVxdWlyZSgnbWljcm9tYXJrLWV4dGVuc2lvbi1mcm9udG1hdHRlci9saWIvbWF0dGVycycpXG5cbmZ1bmN0aW9uIGNyZWF0ZVRvTWFya2Rvd24ob3B0aW9ucykge1xuICB2YXIgdW5zYWZlID0gW11cbiAgdmFyIGhhbmRsZXJzID0ge31cbiAgdmFyIHNldHRpbmdzID0gbWF0dGVycyhvcHRpb25zKVxuICB2YXIgbGVuZ3RoID0gc2V0dGluZ3MubGVuZ3RoXG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciBtYXR0ZXJcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIG1hdHRlciA9IHNldHRpbmdzW2luZGV4XVxuICAgIGhhbmRsZXJzW21hdHRlci50eXBlXSA9IGhhbmRsZXIobWF0dGVyKVxuICAgIHVuc2FmZS5wdXNoKHthdEJyZWFrOiB0cnVlLCBjaGFyYWN0ZXI6IGZlbmNlKG1hdHRlciwgJ29wZW4nKS5jaGFyQXQoMCl9KVxuICB9XG5cbiAgcmV0dXJuIHt1bnNhZmU6IHVuc2FmZSwgaGFuZGxlcnM6IGhhbmRsZXJzfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVyKG1hdHRlcikge1xuICB2YXIgb3BlbiA9IGZlbmNlKG1hdHRlciwgJ29wZW4nKVxuICB2YXIgY2xvc2UgPSBmZW5jZShtYXR0ZXIsICdjbG9zZScpXG5cbiAgcmV0dXJuIGhhbmRsZVxuXG4gIGZ1bmN0aW9uIGhhbmRsZShub2RlKSB7XG4gICAgcmV0dXJuIG9wZW4gKyAobm9kZS52YWx1ZSA/ICdcXG4nICsgbm9kZS52YWx1ZSA6ICcnKSArICdcXG4nICsgY2xvc2VcbiAgfVxufVxuXG5mdW5jdGlvbiBmZW5jZShtYXR0ZXIsIHByb3ApIHtcbiAgdmFyIG1hcmtlclxuXG4gIGlmIChtYXR0ZXIubWFya2VyKSB7XG4gICAgbWFya2VyID0gcGljayhtYXR0ZXIubWFya2VyLCBwcm9wKVxuICAgIHJldHVybiBtYXJrZXIgKyBtYXJrZXIgKyBtYXJrZXJcbiAgfVxuXG4gIHJldHVybiBwaWNrKG1hdHRlci5mZW5jZSwgcHJvcClcbn1cblxuZnVuY3Rpb24gcGljayhzY2hlbWEsIHByb3ApIHtcbiAgcmV0dXJuIHR5cGVvZiBzY2hlbWEgPT09ICdzdHJpbmcnID8gc2NoZW1hIDogc2NoZW1hW3Byb3BdXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIHN5bnRheCA9IHJlcXVpcmUoJ21pY3JvbWFyay1leHRlbnNpb24tZnJvbnRtYXR0ZXInKVxudmFyIGZyb21NYXJrZG93biA9IHJlcXVpcmUoJ21kYXN0LXV0aWwtZnJvbnRtYXR0ZXIvZnJvbS1tYXJrZG93bicpXG52YXIgdG9NYXJrZG93biA9IHJlcXVpcmUoJ21kYXN0LXV0aWwtZnJvbnRtYXR0ZXIvdG8tbWFya2Rvd24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZyb250bWF0dGVyXG5cbmZ1bmN0aW9uIGZyb250bWF0dGVyKG9wdGlvbnMpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLmRhdGEoKVxuICBhZGQoJ21pY3JvbWFya0V4dGVuc2lvbnMnLCBzeW50YXgob3B0aW9ucykpXG4gIGFkZCgnZnJvbU1hcmtkb3duRXh0ZW5zaW9ucycsIGZyb21NYXJrZG93bihvcHRpb25zKSlcbiAgYWRkKCd0b01hcmtkb3duRXh0ZW5zaW9ucycsIHRvTWFya2Rvd24ob3B0aW9ucykpXG4gIGZ1bmN0aW9uIGFkZChmaWVsZCwgdmFsdWUpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgLSBvdGhlciBleHRlbnNpb25zLiAqL1xuICAgIGlmIChkYXRhW2ZpZWxkXSkgZGF0YVtmaWVsZF0ucHVzaCh2YWx1ZSlcbiAgICBlbHNlIGRhdGFbZmllbGRdID0gW3ZhbHVlXVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB0b1N0cmluZ1xuXG4vLyBHZXQgdGhlIHRleHQgY29udGVudCBvZiBhIG5vZGUuXG4vLyBQcmVmZXIgdGhlIG5vZGXigJlzIHBsYWluLXRleHQgZmllbGRzLCBvdGhlcndpc2Ugc2VyaWFsaXplIGl0cyBjaGlsZHJlbixcbi8vIGFuZCBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYW4gYXJyYXksIHNlcmlhbGl6ZSB0aGUgbm9kZXMgaW4gaXQuXG5mdW5jdGlvbiB0b1N0cmluZyhub2RlKSB7XG4gIHJldHVybiAoXG4gICAgKG5vZGUgJiZcbiAgICAgIChub2RlLnZhbHVlIHx8XG4gICAgICAgIG5vZGUuYWx0IHx8XG4gICAgICAgIG5vZGUudGl0bGUgfHxcbiAgICAgICAgKCdjaGlsZHJlbicgaW4gbm9kZSAmJiBhbGwobm9kZS5jaGlsZHJlbikpIHx8XG4gICAgICAgICgnbGVuZ3RoJyBpbiBub2RlICYmIGFsbChub2RlKSkpKSB8fFxuICAgICcnXG4gIClcbn1cblxuZnVuY3Rpb24gYWxsKHZhbHVlcykge1xuICB2YXIgcmVzdWx0ID0gW11cbiAgdmFyIGluZGV4ID0gLTFcblxuICB3aGlsZSAoKytpbmRleCA8IHZhbHVlcy5sZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gdG9TdHJpbmcodmFsdWVzW2luZGV4XSlcbiAgfVxuXG4gIHJldHVybiByZXN1bHQuam9pbignJylcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYXNzaWduID0gT2JqZWN0LmFzc2lnblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2lnblxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBvd24gPSB7fS5oYXNPd25Qcm9wZXJ0eVxuXG5tb2R1bGUuZXhwb3J0cyA9IG93blxuIiwiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUlkZW50aWZpZXIodmFsdWUpIHtcbiAgcmV0dXJuIChcbiAgICB2YWx1ZSAvLyBDb2xsYXBzZSBNYXJrZG93biB3aGl0ZXNwYWNlLlxuICAgICAgLnJlcGxhY2UoL1tcXHRcXG5cXHIgXSsvZywgJyAnKSAvLyBUcmltLlxuICAgICAgLnJlcGxhY2UoL14gfCAkL2csICcnKSAvLyBTb21lIGNoYXJhY3RlcnMgYXJlIGNvbnNpZGVyZWQg4oCcdXBwZXJjYXNl4oCdLCBidXQgaWYgdGhlaXIgbG93ZXJjYXNlXG4gICAgICAvLyBjb3VudGVycGFydCBpcyB1cHBlcmNhc2VkIHdpbGwgcmVzdWx0IGluIGEgZGlmZmVyZW50IHVwcGVyY2FzZVxuICAgICAgLy8gY2hhcmFjdGVyLlxuICAgICAgLy8gSGVuY2UsIHRvIGdldCB0aGF0IGZvcm0sIHdlIHBlcmZvcm0gYm90aCBsb3dlci0gYW5kIHVwcGVyY2FzZS5cbiAgICAgIC8vIFVwcGVyIGNhc2UgbWFrZXMgc3VyZSBrZXlzIHdpbGwgbm90IGludGVyYWN0IHdpdGggZGVmYXVsdCBwcm90b3R5cGFsXG4gICAgICAvLyBtZXRob2RzOiBubyBvYmplY3QgbWV0aG9kIGlzIHVwcGVyY2FzZS5cbiAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAudG9VcHBlckNhc2UoKVxuICApXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbm9ybWFsaXplSWRlbnRpZmllclxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlXG5cbm1vZHVsZS5leHBvcnRzID0gZnJvbUNoYXJDb2RlXG4iLCIndXNlIHN0cmljdCdcblxudmFyIGZyb21DaGFyQ29kZSA9IHJlcXVpcmUoJy4uL2NvbnN0YW50L2Zyb20tY2hhci1jb2RlLmpzJylcblxuZnVuY3Rpb24gc2FmZUZyb21JbnQodmFsdWUsIGJhc2UpIHtcbiAgdmFyIGNvZGUgPSBwYXJzZUludCh2YWx1ZSwgYmFzZSlcblxuICBpZiAoXG4gICAgLy8gQzAgZXhjZXB0IGZvciBIVCwgTEYsIEZGLCBDUiwgc3BhY2VcbiAgICBjb2RlIDwgOSB8fFxuICAgIGNvZGUgPT09IDExIHx8XG4gICAgKGNvZGUgPiAxMyAmJiBjb2RlIDwgMzIpIHx8IC8vIENvbnRyb2wgY2hhcmFjdGVyIChERUwpIG9mIHRoZSBiYXNpYyBibG9jayBhbmQgQzEgY29udHJvbHMuXG4gICAgKGNvZGUgPiAxMjYgJiYgY29kZSA8IDE2MCkgfHwgLy8gTG9uZSBoaWdoIHN1cnJvZ2F0ZXMgYW5kIGxvdyBzdXJyb2dhdGVzLlxuICAgIChjb2RlID4gNTUyOTUgJiYgY29kZSA8IDU3MzQ0KSB8fCAvLyBOb25jaGFyYWN0ZXJzLlxuICAgIChjb2RlID4gNjQ5NzUgJiYgY29kZSA8IDY1MDA4KSB8fFxuICAgIChjb2RlICYgNjU1MzUpID09PSA2NTUzNSB8fFxuICAgIChjb2RlICYgNjU1MzUpID09PSA2NTUzNCB8fCAvLyBPdXQgb2YgcmFuZ2VcbiAgICBjb2RlID4gMTExNDExMVxuICApIHtcbiAgICByZXR1cm4gJ1xcdUZGRkQnXG4gIH1cblxuICByZXR1cm4gZnJvbUNoYXJDb2RlKGNvZGUpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2FmZUZyb21JbnRcbiIsIid1c2Ugc3RyaWN0J1xuXG5mdW5jdGlvbiBtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkge1xuICByZXR1cm4gY29kZSA8IC0yXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWFya2Rvd25MaW5lRW5kaW5nXG4iLCIndXNlIHN0cmljdCdcblxuZnVuY3Rpb24gbWFya2Rvd25TcGFjZShjb2RlKSB7XG4gIHJldHVybiBjb2RlID09PSAtMiB8fCBjb2RlID09PSAtMSB8fCBjb2RlID09PSAzMlxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hcmtkb3duU3BhY2VcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgbWFya2Rvd25TcGFjZSA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1zcGFjZS5qcycpXG5cbmZ1bmN0aW9uIHNwYWNlRmFjdG9yeShlZmZlY3RzLCBvaywgdHlwZSwgbWF4KSB7XG4gIHZhciBsaW1pdCA9IG1heCA/IG1heCAtIDEgOiBJbmZpbml0eVxuICB2YXIgc2l6ZSA9IDBcbiAgcmV0dXJuIHN0YXJ0XG5cbiAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKHR5cGUpXG4gICAgICByZXR1cm4gcHJlZml4KGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBwcmVmaXgoY29kZSkge1xuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpICYmIHNpemUrKyA8IGxpbWl0KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBwcmVmaXhcbiAgICB9XG5cbiAgICBlZmZlY3RzLmV4aXQodHlwZSlcbiAgICByZXR1cm4gb2soY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNwYWNlRmFjdG9yeVxuIiwiJ3VzZSBzdHJpY3QnXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHt2YWx1ZTogdHJ1ZX0pXG5cbnZhciBtYXJrZG93bkxpbmVFbmRpbmcgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmcuanMnKVxudmFyIGZhY3RvcnlTcGFjZSA9IHJlcXVpcmUoJy4uL3Rva2VuaXplL2ZhY3Rvcnktc3BhY2UuanMnKVxuXG52YXIgdG9rZW5pemUgPSBpbml0aWFsaXplQ29udGVudFxuXG5mdW5jdGlvbiBpbml0aWFsaXplQ29udGVudChlZmZlY3RzKSB7XG4gIHZhciBjb250ZW50U3RhcnQgPSBlZmZlY3RzLmF0dGVtcHQoXG4gICAgdGhpcy5wYXJzZXIuY29uc3RydWN0cy5jb250ZW50SW5pdGlhbCxcbiAgICBhZnRlckNvbnRlbnRTdGFydENvbnN0cnVjdCxcbiAgICBwYXJhZ3JhcGhJbml0aWFsXG4gIClcbiAgdmFyIHByZXZpb3VzXG4gIHJldHVybiBjb250ZW50U3RhcnRcblxuICBmdW5jdGlvbiBhZnRlckNvbnRlbnRTdGFydENvbnN0cnVjdChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgZWZmZWN0cy5lbnRlcignbGluZUVuZGluZycpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgZWZmZWN0cy5leGl0KCdsaW5lRW5kaW5nJylcbiAgICByZXR1cm4gZmFjdG9yeVNwYWNlKGVmZmVjdHMsIGNvbnRlbnRTdGFydCwgJ2xpbmVQcmVmaXgnKVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyYWdyYXBoSW5pdGlhbChjb2RlKSB7XG4gICAgZWZmZWN0cy5lbnRlcigncGFyYWdyYXBoJylcbiAgICByZXR1cm4gbGluZVN0YXJ0KGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBsaW5lU3RhcnQoY29kZSkge1xuICAgIHZhciB0b2tlbiA9IGVmZmVjdHMuZW50ZXIoJ2NodW5rVGV4dCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAndGV4dCcsXG4gICAgICBwcmV2aW91czogcHJldmlvdXNcbiAgICB9KVxuXG4gICAgaWYgKHByZXZpb3VzKSB7XG4gICAgICBwcmV2aW91cy5uZXh0ID0gdG9rZW5cbiAgICB9XG5cbiAgICBwcmV2aW91cyA9IHRva2VuXG4gICAgcmV0dXJuIGRhdGEoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRhdGEoY29kZSkge1xuICAgIGlmIChjb2RlID09PSBudWxsKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ2NodW5rVGV4dCcpXG4gICAgICBlZmZlY3RzLmV4aXQoJ3BhcmFncmFwaCcpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KCdjaHVua1RleHQnKVxuICAgICAgcmV0dXJuIGxpbmVTdGFydFxuICAgIH0gLy8gRGF0YS5cblxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIHJldHVybiBkYXRhXG4gIH1cbn1cblxuZXhwb3J0cy50b2tlbml6ZSA9IHRva2VuaXplXG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1hcmtkb3duTGluZUVuZGluZyA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy5qcycpXG52YXIgZmFjdG9yeVNwYWNlID0gcmVxdWlyZSgnLi9mYWN0b3J5LXNwYWNlLmpzJylcblxudmFyIHBhcnRpYWxCbGFua0xpbmUgPSB7XG4gIHRva2VuaXplOiB0b2tlbml6ZVBhcnRpYWxCbGFua0xpbmUsXG4gIHBhcnRpYWw6IHRydWVcbn1cblxuZnVuY3Rpb24gdG9rZW5pemVQYXJ0aWFsQmxhbmtMaW5lKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgcmV0dXJuIGZhY3RvcnlTcGFjZShlZmZlY3RzLCBhZnRlcldoaXRlc3BhY2UsICdsaW5lUHJlZml4JylcblxuICBmdW5jdGlvbiBhZnRlcldoaXRlc3BhY2UoY29kZSkge1xuICAgIHJldHVybiBjb2RlID09PSBudWxsIHx8IG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSA/IG9rKGNvZGUpIDogbm9rKGNvZGUpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJ0aWFsQmxhbmtMaW5lXG4iLCIndXNlIHN0cmljdCdcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge3ZhbHVlOiB0cnVlfSlcblxudmFyIG1hcmtkb3duTGluZUVuZGluZyA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy5qcycpXG52YXIgZmFjdG9yeVNwYWNlID0gcmVxdWlyZSgnLi4vdG9rZW5pemUvZmFjdG9yeS1zcGFjZS5qcycpXG52YXIgcGFydGlhbEJsYW5rTGluZSA9IHJlcXVpcmUoJy4uL3Rva2VuaXplL3BhcnRpYWwtYmxhbmstbGluZS5qcycpXG5cbnZhciB0b2tlbml6ZSA9IGluaXRpYWxpemVEb2N1bWVudFxudmFyIGNvbnRhaW5lckNvbnN0cnVjdCA9IHtcbiAgdG9rZW5pemU6IHRva2VuaXplQ29udGFpbmVyXG59XG52YXIgbGF6eUZsb3dDb25zdHJ1Y3QgPSB7XG4gIHRva2VuaXplOiB0b2tlbml6ZUxhenlGbG93XG59XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVEb2N1bWVudChlZmZlY3RzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICB2YXIgc3RhY2sgPSBbXVxuICB2YXIgY29udGludWVkID0gMFxuICB2YXIgaW5zcGVjdENvbnN0cnVjdCA9IHtcbiAgICB0b2tlbml6ZTogdG9rZW5pemVJbnNwZWN0LFxuICAgIHBhcnRpYWw6IHRydWVcbiAgfVxuICB2YXIgaW5zcGVjdFJlc3VsdFxuICB2YXIgY2hpbGRGbG93XG4gIHZhciBjaGlsZFRva2VuXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBpZiAoY29udGludWVkIDwgc3RhY2subGVuZ3RoKSB7XG4gICAgICBzZWxmLmNvbnRhaW5lclN0YXRlID0gc3RhY2tbY29udGludWVkXVsxXVxuICAgICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChcbiAgICAgICAgc3RhY2tbY29udGludWVkXVswXS5jb250aW51YXRpb24sXG4gICAgICAgIGRvY3VtZW50Q29udGludWUsXG4gICAgICAgIGRvY3VtZW50Q29udGludWVkXG4gICAgICApKGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIGRvY3VtZW50Q29udGludWVkKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBkb2N1bWVudENvbnRpbnVlKGNvZGUpIHtcbiAgICBjb250aW51ZWQrK1xuICAgIHJldHVybiBzdGFydChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZG9jdW1lbnRDb250aW51ZWQoY29kZSkge1xuICAgIC8vIElmIHdl4oCZcmUgaW4gYSBjb25jcmV0ZSBjb25zdHJ1Y3QgKHN1Y2ggYXMgd2hlbiBleHBlY3RpbmcgYW5vdGhlciBsaW5lIG9mXG4gICAgLy8gSFRNTCwgb3Igd2UgcmVzdWx0ZWQgaW4gbGF6eSBjb250ZW50KSwgd2UgY2FuIGltbWVkaWF0ZWx5IHN0YXJ0IGZsb3cuXG4gICAgaWYgKGluc3BlY3RSZXN1bHQgJiYgaW5zcGVjdFJlc3VsdC5mbG93Q29udGludWUpIHtcbiAgICAgIHJldHVybiBmbG93U3RhcnQoY29kZSlcbiAgICB9XG5cbiAgICBzZWxmLmludGVycnVwdCA9XG4gICAgICBjaGlsZEZsb3cgJiZcbiAgICAgIGNoaWxkRmxvdy5jdXJyZW50Q29uc3RydWN0ICYmXG4gICAgICBjaGlsZEZsb3cuY3VycmVudENvbnN0cnVjdC5pbnRlcnJ1cHRpYmxlXG4gICAgc2VsZi5jb250YWluZXJTdGF0ZSA9IHt9XG4gICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChcbiAgICAgIGNvbnRhaW5lckNvbnN0cnVjdCxcbiAgICAgIGNvbnRhaW5lckNvbnRpbnVlLFxuICAgICAgZmxvd1N0YXJ0XG4gICAgKShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29udGFpbmVyQ29udGludWUoY29kZSkge1xuICAgIHN0YWNrLnB1c2goW3NlbGYuY3VycmVudENvbnN0cnVjdCwgc2VsZi5jb250YWluZXJTdGF0ZV0pXG4gICAgc2VsZi5jb250YWluZXJTdGF0ZSA9IHVuZGVmaW5lZFxuICAgIHJldHVybiBkb2N1bWVudENvbnRpbnVlZChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZmxvd1N0YXJ0KGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xuICAgICAgZXhpdENvbnRhaW5lcnMoMCwgdHJ1ZSlcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY2hpbGRGbG93ID0gY2hpbGRGbG93IHx8IHNlbGYucGFyc2VyLmZsb3coc2VsZi5ub3coKSlcbiAgICBlZmZlY3RzLmVudGVyKCdjaHVua0Zsb3cnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ2Zsb3cnLFxuICAgICAgcHJldmlvdXM6IGNoaWxkVG9rZW4sXG4gICAgICBfdG9rZW5pemVyOiBjaGlsZEZsb3dcbiAgICB9KVxuICAgIHJldHVybiBmbG93Q29udGludWUoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGZsb3dDb250aW51ZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwpIHtcbiAgICAgIGNvbnRpbnVlRmxvdyhlZmZlY3RzLmV4aXQoJ2NodW5rRmxvdycpKVxuICAgICAgcmV0dXJuIGZsb3dTdGFydChjb2RlKVxuICAgIH1cblxuICAgIGlmIChtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgY29udGludWVGbG93KGVmZmVjdHMuZXhpdCgnY2h1bmtGbG93JykpXG4gICAgICByZXR1cm4gZWZmZWN0cy5jaGVjayhpbnNwZWN0Q29uc3RydWN0LCBkb2N1bWVudEFmdGVyUGVlaylcbiAgICB9XG5cbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICByZXR1cm4gZmxvd0NvbnRpbnVlXG4gIH1cblxuICBmdW5jdGlvbiBkb2N1bWVudEFmdGVyUGVlayhjb2RlKSB7XG4gICAgZXhpdENvbnRhaW5lcnMoXG4gICAgICBpbnNwZWN0UmVzdWx0LmNvbnRpbnVlZCxcbiAgICAgIGluc3BlY3RSZXN1bHQgJiYgaW5zcGVjdFJlc3VsdC5mbG93RW5kXG4gICAgKVxuICAgIGNvbnRpbnVlZCA9IDBcbiAgICByZXR1cm4gc3RhcnQoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnRpbnVlRmxvdyh0b2tlbikge1xuICAgIGlmIChjaGlsZFRva2VuKSBjaGlsZFRva2VuLm5leHQgPSB0b2tlblxuICAgIGNoaWxkVG9rZW4gPSB0b2tlblxuICAgIGNoaWxkRmxvdy5sYXp5ID0gaW5zcGVjdFJlc3VsdCAmJiBpbnNwZWN0UmVzdWx0LmxhenlcbiAgICBjaGlsZEZsb3cuZGVmaW5lU2tpcCh0b2tlbi5zdGFydClcbiAgICBjaGlsZEZsb3cud3JpdGUoc2VsZi5zbGljZVN0cmVhbSh0b2tlbikpXG4gIH1cblxuICBmdW5jdGlvbiBleGl0Q29udGFpbmVycyhzaXplLCBlbmQpIHtcbiAgICB2YXIgaW5kZXggPSBzdGFjay5sZW5ndGggLy8gQ2xvc2UgdGhlIGZsb3cuXG5cbiAgICBpZiAoY2hpbGRGbG93ICYmIGVuZCkge1xuICAgICAgY2hpbGRGbG93LndyaXRlKFtudWxsXSlcbiAgICAgIGNoaWxkVG9rZW4gPSBjaGlsZEZsb3cgPSB1bmRlZmluZWRcbiAgICB9IC8vIEV4aXQgb3BlbiBjb250YWluZXJzLlxuXG4gICAgd2hpbGUgKGluZGV4LS0gPiBzaXplKSB7XG4gICAgICBzZWxmLmNvbnRhaW5lclN0YXRlID0gc3RhY2tbaW5kZXhdWzFdXG4gICAgICBzdGFja1tpbmRleF1bMF0uZXhpdC5jYWxsKHNlbGYsIGVmZmVjdHMpXG4gICAgfVxuXG4gICAgc3RhY2subGVuZ3RoID0gc2l6ZVxuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW5pemVJbnNwZWN0KGVmZmVjdHMsIG9rKSB7XG4gICAgdmFyIHN1YmNvbnRpbnVlZCA9IDBcbiAgICBpbnNwZWN0UmVzdWx0ID0ge31cbiAgICByZXR1cm4gaW5zcGVjdFN0YXJ0XG5cbiAgICBmdW5jdGlvbiBpbnNwZWN0U3RhcnQoY29kZSkge1xuICAgICAgaWYgKHN1YmNvbnRpbnVlZCA8IHN0YWNrLmxlbmd0aCkge1xuICAgICAgICBzZWxmLmNvbnRhaW5lclN0YXRlID0gc3RhY2tbc3ViY29udGludWVkXVsxXVxuICAgICAgICByZXR1cm4gZWZmZWN0cy5hdHRlbXB0KFxuICAgICAgICAgIHN0YWNrW3N1YmNvbnRpbnVlZF1bMF0uY29udGludWF0aW9uLFxuICAgICAgICAgIGluc3BlY3RDb250aW51ZSxcbiAgICAgICAgICBpbnNwZWN0TGVzc1xuICAgICAgICApKGNvZGUpXG4gICAgICB9IC8vIElmIHdl4oCZcmUgY29udGludWVkIGJ1dCBpbiBhIGNvbmNyZXRlIGZsb3csIHdlIGNhbuKAmXQgaGF2ZSBtb3JlXG4gICAgICAvLyBjb250YWluZXJzLlxuXG4gICAgICBpZiAoY2hpbGRGbG93LmN1cnJlbnRDb25zdHJ1Y3QgJiYgY2hpbGRGbG93LmN1cnJlbnRDb25zdHJ1Y3QuY29uY3JldGUpIHtcbiAgICAgICAgaW5zcGVjdFJlc3VsdC5mbG93Q29udGludWUgPSB0cnVlXG4gICAgICAgIHJldHVybiBpbnNwZWN0RG9uZShjb2RlKVxuICAgICAgfVxuXG4gICAgICBzZWxmLmludGVycnVwdCA9XG4gICAgICAgIGNoaWxkRmxvdy5jdXJyZW50Q29uc3RydWN0ICYmIGNoaWxkRmxvdy5jdXJyZW50Q29uc3RydWN0LmludGVycnVwdGlibGVcbiAgICAgIHNlbGYuY29udGFpbmVyU3RhdGUgPSB7fVxuICAgICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChcbiAgICAgICAgY29udGFpbmVyQ29uc3RydWN0LFxuICAgICAgICBpbnNwZWN0Rmxvd0VuZCxcbiAgICAgICAgaW5zcGVjdERvbmVcbiAgICAgICkoY29kZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnNwZWN0Q29udGludWUoY29kZSkge1xuICAgICAgc3ViY29udGludWVkKytcbiAgICAgIHJldHVybiBzZWxmLmNvbnRhaW5lclN0YXRlLl9jbG9zZUZsb3dcbiAgICAgICAgPyBpbnNwZWN0Rmxvd0VuZChjb2RlKVxuICAgICAgICA6IGluc3BlY3RTdGFydChjb2RlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3BlY3RMZXNzKGNvZGUpIHtcbiAgICAgIGlmIChjaGlsZEZsb3cuY3VycmVudENvbnN0cnVjdCAmJiBjaGlsZEZsb3cuY3VycmVudENvbnN0cnVjdC5sYXp5KSB7XG4gICAgICAgIC8vIE1heWJlIGFub3RoZXIgY29udGFpbmVyP1xuICAgICAgICBzZWxmLmNvbnRhaW5lclN0YXRlID0ge31cbiAgICAgICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChcbiAgICAgICAgICBjb250YWluZXJDb25zdHJ1Y3QsXG4gICAgICAgICAgaW5zcGVjdEZsb3dFbmQsIC8vIE1heWJlIGZsb3csIG9yIGEgYmxhbmsgbGluZT9cbiAgICAgICAgICBlZmZlY3RzLmF0dGVtcHQoXG4gICAgICAgICAgICBsYXp5Rmxvd0NvbnN0cnVjdCxcbiAgICAgICAgICAgIGluc3BlY3RGbG93RW5kLFxuICAgICAgICAgICAgZWZmZWN0cy5jaGVjayhwYXJ0aWFsQmxhbmtMaW5lLCBpbnNwZWN0Rmxvd0VuZCwgaW5zcGVjdExhenkpXG4gICAgICAgICAgKVxuICAgICAgICApKGNvZGUpXG4gICAgICB9IC8vIE90aGVyd2lzZSB3ZeKAmXJlIGludGVycnVwdGluZy5cblxuICAgICAgcmV0dXJuIGluc3BlY3RGbG93RW5kKGNvZGUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zcGVjdExhenkoY29kZSkge1xuICAgICAgLy8gQWN0IGFzIGlmIGFsbCBjb250YWluZXJzIGFyZSBjb250aW51ZWQuXG4gICAgICBzdWJjb250aW51ZWQgPSBzdGFjay5sZW5ndGhcbiAgICAgIGluc3BlY3RSZXN1bHQubGF6eSA9IHRydWVcbiAgICAgIGluc3BlY3RSZXN1bHQuZmxvd0NvbnRpbnVlID0gdHJ1ZVxuICAgICAgcmV0dXJuIGluc3BlY3REb25lKGNvZGUpXG4gICAgfSAvLyBXZeKAmXJlIGRvbmUgd2l0aCBmbG93IGlmIHdlIGhhdmUgbW9yZSBjb250YWluZXJzLCBvciBhbiBpbnRlcnJ1cHRpb24uXG5cbiAgICBmdW5jdGlvbiBpbnNwZWN0Rmxvd0VuZChjb2RlKSB7XG4gICAgICBpbnNwZWN0UmVzdWx0LmZsb3dFbmQgPSB0cnVlXG4gICAgICByZXR1cm4gaW5zcGVjdERvbmUoY29kZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnNwZWN0RG9uZShjb2RlKSB7XG4gICAgICBpbnNwZWN0UmVzdWx0LmNvbnRpbnVlZCA9IHN1YmNvbnRpbnVlZFxuICAgICAgc2VsZi5pbnRlcnJ1cHQgPSBzZWxmLmNvbnRhaW5lclN0YXRlID0gdW5kZWZpbmVkXG4gICAgICByZXR1cm4gb2soY29kZSlcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9rZW5pemVDb250YWluZXIoZWZmZWN0cywgb2ssIG5vaykge1xuICByZXR1cm4gZmFjdG9yeVNwYWNlKFxuICAgIGVmZmVjdHMsXG4gICAgZWZmZWN0cy5hdHRlbXB0KHRoaXMucGFyc2VyLmNvbnN0cnVjdHMuZG9jdW1lbnQsIG9rLCBub2spLFxuICAgICdsaW5lUHJlZml4JyxcbiAgICB0aGlzLnBhcnNlci5jb25zdHJ1Y3RzLmRpc2FibGUubnVsbC5pbmRleE9mKCdjb2RlSW5kZW50ZWQnKSA+IC0xXG4gICAgICA/IHVuZGVmaW5lZFxuICAgICAgOiA0XG4gIClcbn1cblxuZnVuY3Rpb24gdG9rZW5pemVMYXp5RmxvdyhlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHJldHVybiBmYWN0b3J5U3BhY2UoXG4gICAgZWZmZWN0cyxcbiAgICBlZmZlY3RzLmxhenkodGhpcy5wYXJzZXIuY29uc3RydWN0cy5mbG93LCBvaywgbm9rKSxcbiAgICAnbGluZVByZWZpeCcsXG4gICAgdGhpcy5wYXJzZXIuY29uc3RydWN0cy5kaXNhYmxlLm51bGwuaW5kZXhPZignY29kZUluZGVudGVkJykgPiAtMVxuICAgICAgPyB1bmRlZmluZWRcbiAgICAgIDogNFxuICApXG59XG5cbmV4cG9ydHMudG9rZW5pemUgPSB0b2tlbml6ZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbi8vIENvdW50cyB0YWJzIGJhc2VkIG9uIHRoZWlyIGV4cGFuZGVkIHNpemUsIGFuZCBDUitMRiBhcyBvbmUgY2hhcmFjdGVyLlxuXG5mdW5jdGlvbiBzaXplQ2h1bmtzKGNodW5rcykge1xuICB2YXIgaW5kZXggPSAtMVxuICB2YXIgc2l6ZSA9IDBcblxuICB3aGlsZSAoKytpbmRleCA8IGNodW5rcy5sZW5ndGgpIHtcbiAgICBzaXplICs9IHR5cGVvZiBjaHVua3NbaW5kZXhdID09PSAnc3RyaW5nJyA/IGNodW5rc1tpbmRleF0ubGVuZ3RoIDogMVxuICB9XG5cbiAgcmV0dXJuIHNpemVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaXplQ2h1bmtzXG4iLCIndXNlIHN0cmljdCdcblxudmFyIHNpemVDaHVua3MgPSByZXF1aXJlKCcuL3NpemUtY2h1bmtzLmpzJylcblxuZnVuY3Rpb24gcHJlZml4U2l6ZShldmVudHMsIHR5cGUpIHtcbiAgdmFyIHRhaWwgPSBldmVudHNbZXZlbnRzLmxlbmd0aCAtIDFdXG4gIGlmICghdGFpbCB8fCB0YWlsWzFdLnR5cGUgIT09IHR5cGUpIHJldHVybiAwXG4gIHJldHVybiBzaXplQ2h1bmtzKHRhaWxbMl0uc2xpY2VTdHJlYW0odGFpbFsxXSkpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJlZml4U2l6ZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBzcGxpY2UgPSBbXS5zcGxpY2VcblxubW9kdWxlLmV4cG9ydHMgPSBzcGxpY2VcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgc3BsaWNlID0gcmVxdWlyZSgnLi4vY29uc3RhbnQvc3BsaWNlLmpzJylcblxuLy8gY2F1c2VzIGEgc3RhY2sgb3ZlcmZsb3cgaW4gVjggd2hlbiB0cnlpbmcgdG8gaW5zZXJ0IDEwMGsgaXRlbXMgZm9yIGluc3RhbmNlLlxuXG5mdW5jdGlvbiBjaHVua2VkU3BsaWNlKGxpc3QsIHN0YXJ0LCByZW1vdmUsIGl0ZW1zKSB7XG4gIHZhciBlbmQgPSBsaXN0Lmxlbmd0aFxuICB2YXIgY2h1bmtTdGFydCA9IDBcbiAgdmFyIHBhcmFtZXRlcnMgLy8gTWFrZSBzdGFydCBiZXR3ZWVuIHplcm8gYW5kIGBlbmRgIChpbmNsdWRlZCkuXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gLXN0YXJ0ID4gZW5kID8gMCA6IGVuZCArIHN0YXJ0XG4gIH0gZWxzZSB7XG4gICAgc3RhcnQgPSBzdGFydCA+IGVuZCA/IGVuZCA6IHN0YXJ0XG4gIH1cblxuICByZW1vdmUgPSByZW1vdmUgPiAwID8gcmVtb3ZlIDogMCAvLyBObyBuZWVkIHRvIGNodW5rIHRoZSBpdGVtcyBpZiB0aGVyZeKAmXMgb25seSBhIGNvdXBsZSAoMTBrKSBpdGVtcy5cblxuICBpZiAoaXRlbXMubGVuZ3RoIDwgMTAwMDApIHtcbiAgICBwYXJhbWV0ZXJzID0gQXJyYXkuZnJvbShpdGVtcylcbiAgICBwYXJhbWV0ZXJzLnVuc2hpZnQoc3RhcnQsIHJlbW92ZSlcbiAgICBzcGxpY2UuYXBwbHkobGlzdCwgcGFyYW1ldGVycylcbiAgfSBlbHNlIHtcbiAgICAvLyBEZWxldGUgYHJlbW92ZWAgaXRlbXMgc3RhcnRpbmcgZnJvbSBgc3RhcnRgXG4gICAgaWYgKHJlbW92ZSkgc3BsaWNlLmFwcGx5KGxpc3QsIFtzdGFydCwgcmVtb3ZlXSkgLy8gSW5zZXJ0IHRoZSBpdGVtcyBpbiBjaHVua3MgdG8gbm90IGNhdXNlIHN0YWNrIG92ZXJmbG93cy5cblxuICAgIHdoaWxlIChjaHVua1N0YXJ0IDwgaXRlbXMubGVuZ3RoKSB7XG4gICAgICBwYXJhbWV0ZXJzID0gaXRlbXMuc2xpY2UoY2h1bmtTdGFydCwgY2h1bmtTdGFydCArIDEwMDAwKVxuICAgICAgcGFyYW1ldGVycy51bnNoaWZ0KHN0YXJ0LCAwKVxuICAgICAgc3BsaWNlLmFwcGx5KGxpc3QsIHBhcmFtZXRlcnMpXG4gICAgICBjaHVua1N0YXJ0ICs9IDEwMDAwXG4gICAgICBzdGFydCArPSAxMDAwMFxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNodW5rZWRTcGxpY2VcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYXNzaWduID0gcmVxdWlyZSgnLi4vY29uc3RhbnQvYXNzaWduLmpzJylcblxuZnVuY3Rpb24gc2hhbGxvdyhvYmplY3QpIHtcbiAgcmV0dXJuIGFzc2lnbih7fSwgb2JqZWN0KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNoYWxsb3dcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYXNzaWduID0gcmVxdWlyZSgnLi4vY29uc3RhbnQvYXNzaWduLmpzJylcbnZhciBjaHVua2VkU3BsaWNlID0gcmVxdWlyZSgnLi9jaHVua2VkLXNwbGljZS5qcycpXG52YXIgc2hhbGxvdyA9IHJlcXVpcmUoJy4vc2hhbGxvdy5qcycpXG5cbmZ1bmN0aW9uIHN1YnRva2VuaXplKGV2ZW50cykge1xuICB2YXIganVtcHMgPSB7fVxuICB2YXIgaW5kZXggPSAtMVxuICB2YXIgZXZlbnRcbiAgdmFyIGxpbmVJbmRleFxuICB2YXIgb3RoZXJJbmRleFxuICB2YXIgb3RoZXJFdmVudFxuICB2YXIgcGFyYW1ldGVyc1xuICB2YXIgc3ViZXZlbnRzXG4gIHZhciBtb3JlXG5cbiAgd2hpbGUgKCsraW5kZXggPCBldmVudHMubGVuZ3RoKSB7XG4gICAgd2hpbGUgKGluZGV4IGluIGp1bXBzKSB7XG4gICAgICBpbmRleCA9IGp1bXBzW2luZGV4XVxuICAgIH1cblxuICAgIGV2ZW50ID0gZXZlbnRzW2luZGV4XSAvLyBBZGQgYSBob29rIGZvciB0aGUgR0ZNIHRhc2tsaXN0IGV4dGVuc2lvbiwgd2hpY2ggbmVlZHMgdG8ga25vdyBpZiB0ZXh0XG4gICAgLy8gaXMgaW4gdGhlIGZpcnN0IGNvbnRlbnQgb2YgYSBsaXN0IGl0ZW0uXG5cbiAgICBpZiAoXG4gICAgICBpbmRleCAmJlxuICAgICAgZXZlbnRbMV0udHlwZSA9PT0gJ2NodW5rRmxvdycgJiZcbiAgICAgIGV2ZW50c1tpbmRleCAtIDFdWzFdLnR5cGUgPT09ICdsaXN0SXRlbVByZWZpeCdcbiAgICApIHtcbiAgICAgIHN1YmV2ZW50cyA9IGV2ZW50WzFdLl90b2tlbml6ZXIuZXZlbnRzXG4gICAgICBvdGhlckluZGV4ID0gMFxuXG4gICAgICBpZiAoXG4gICAgICAgIG90aGVySW5kZXggPCBzdWJldmVudHMubGVuZ3RoICYmXG4gICAgICAgIHN1YmV2ZW50c1tvdGhlckluZGV4XVsxXS50eXBlID09PSAnbGluZUVuZGluZ0JsYW5rJ1xuICAgICAgKSB7XG4gICAgICAgIG90aGVySW5kZXggKz0gMlxuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIG90aGVySW5kZXggPCBzdWJldmVudHMubGVuZ3RoICYmXG4gICAgICAgIHN1YmV2ZW50c1tvdGhlckluZGV4XVsxXS50eXBlID09PSAnY29udGVudCdcbiAgICAgICkge1xuICAgICAgICB3aGlsZSAoKytvdGhlckluZGV4IDwgc3ViZXZlbnRzLmxlbmd0aCkge1xuICAgICAgICAgIGlmIChzdWJldmVudHNbb3RoZXJJbmRleF1bMV0udHlwZSA9PT0gJ2NvbnRlbnQnKSB7XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzdWJldmVudHNbb3RoZXJJbmRleF1bMV0udHlwZSA9PT0gJ2NodW5rVGV4dCcpIHtcbiAgICAgICAgICAgIHN1YmV2ZW50c1tvdGhlckluZGV4XVsxXS5pc0luRmlyc3RDb250ZW50T2ZMaXN0SXRlbSA9IHRydWVcbiAgICAgICAgICAgIG90aGVySW5kZXgrK1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gLy8gRW50ZXIuXG5cbiAgICBpZiAoZXZlbnRbMF0gPT09ICdlbnRlcicpIHtcbiAgICAgIGlmIChldmVudFsxXS5jb250ZW50VHlwZSkge1xuICAgICAgICBhc3NpZ24oanVtcHMsIHN1YmNvbnRlbnQoZXZlbnRzLCBpbmRleCkpXG4gICAgICAgIGluZGV4ID0ganVtcHNbaW5kZXhdXG4gICAgICAgIG1vcmUgPSB0cnVlXG4gICAgICB9XG4gICAgfSAvLyBFeGl0LlxuICAgIGVsc2UgaWYgKGV2ZW50WzFdLl9jb250YWluZXIgfHwgZXZlbnRbMV0uX21vdmVQcmV2aW91c0xpbmVFbmRpbmdzKSB7XG4gICAgICBvdGhlckluZGV4ID0gaW5kZXhcbiAgICAgIGxpbmVJbmRleCA9IHVuZGVmaW5lZFxuXG4gICAgICB3aGlsZSAob3RoZXJJbmRleC0tKSB7XG4gICAgICAgIG90aGVyRXZlbnQgPSBldmVudHNbb3RoZXJJbmRleF1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgb3RoZXJFdmVudFsxXS50eXBlID09PSAnbGluZUVuZGluZycgfHxcbiAgICAgICAgICBvdGhlckV2ZW50WzFdLnR5cGUgPT09ICdsaW5lRW5kaW5nQmxhbmsnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdGhlckV2ZW50WzBdID09PSAnZW50ZXInKSB7XG4gICAgICAgICAgICBpZiAobGluZUluZGV4KSB7XG4gICAgICAgICAgICAgIGV2ZW50c1tsaW5lSW5kZXhdWzFdLnR5cGUgPSAnbGluZUVuZGluZ0JsYW5rJ1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdGhlckV2ZW50WzFdLnR5cGUgPSAnbGluZUVuZGluZydcbiAgICAgICAgICAgIGxpbmVJbmRleCA9IG90aGVySW5kZXhcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobGluZUluZGV4KSB7XG4gICAgICAgIC8vIEZpeCBwb3NpdGlvbi5cbiAgICAgICAgZXZlbnRbMV0uZW5kID0gc2hhbGxvdyhldmVudHNbbGluZUluZGV4XVsxXS5zdGFydCkgLy8gU3dpdGNoIGNvbnRhaW5lciBleGl0IHcvIGxpbmUgZW5kaW5ncy5cblxuICAgICAgICBwYXJhbWV0ZXJzID0gZXZlbnRzLnNsaWNlKGxpbmVJbmRleCwgaW5kZXgpXG4gICAgICAgIHBhcmFtZXRlcnMudW5zaGlmdChldmVudClcbiAgICAgICAgY2h1bmtlZFNwbGljZShldmVudHMsIGxpbmVJbmRleCwgaW5kZXggLSBsaW5lSW5kZXggKyAxLCBwYXJhbWV0ZXJzKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAhbW9yZVxufVxuXG5mdW5jdGlvbiBzdWJjb250ZW50KGV2ZW50cywgZXZlbnRJbmRleCkge1xuICB2YXIgdG9rZW4gPSBldmVudHNbZXZlbnRJbmRleF1bMV1cbiAgdmFyIGNvbnRleHQgPSBldmVudHNbZXZlbnRJbmRleF1bMl1cbiAgdmFyIHN0YXJ0UG9zaXRpb24gPSBldmVudEluZGV4IC0gMVxuICB2YXIgc3RhcnRQb3NpdGlvbnMgPSBbXVxuICB2YXIgdG9rZW5pemVyID1cbiAgICB0b2tlbi5fdG9rZW5pemVyIHx8IGNvbnRleHQucGFyc2VyW3Rva2VuLmNvbnRlbnRUeXBlXSh0b2tlbi5zdGFydClcbiAgdmFyIGNoaWxkRXZlbnRzID0gdG9rZW5pemVyLmV2ZW50c1xuICB2YXIganVtcHMgPSBbXVxuICB2YXIgZ2FwcyA9IHt9XG4gIHZhciBzdHJlYW1cbiAgdmFyIHByZXZpb3VzXG4gIHZhciBpbmRleFxuICB2YXIgZW50ZXJlZFxuICB2YXIgZW5kXG4gIHZhciBhZGp1c3QgLy8gTG9vcCBmb3J3YXJkIHRocm91Z2ggdGhlIGxpbmtlZCB0b2tlbnMgdG8gcGFzcyB0aGVtIGluIG9yZGVyIHRvIHRoZVxuICAvLyBzdWJ0b2tlbml6ZXIuXG5cbiAgd2hpbGUgKHRva2VuKSB7XG4gICAgLy8gRmluZCB0aGUgcG9zaXRpb24gb2YgdGhlIGV2ZW50IGZvciB0aGlzIHRva2VuLlxuICAgIHdoaWxlIChldmVudHNbKytzdGFydFBvc2l0aW9uXVsxXSAhPT0gdG9rZW4pIHtcbiAgICAgIC8vIEVtcHR5LlxuICAgIH1cblxuICAgIHN0YXJ0UG9zaXRpb25zLnB1c2goc3RhcnRQb3NpdGlvbilcblxuICAgIGlmICghdG9rZW4uX3Rva2VuaXplcikge1xuICAgICAgc3RyZWFtID0gY29udGV4dC5zbGljZVN0cmVhbSh0b2tlbilcblxuICAgICAgaWYgKCF0b2tlbi5uZXh0KSB7XG4gICAgICAgIHN0cmVhbS5wdXNoKG51bGwpXG4gICAgICB9XG5cbiAgICAgIGlmIChwcmV2aW91cykge1xuICAgICAgICB0b2tlbml6ZXIuZGVmaW5lU2tpcCh0b2tlbi5zdGFydClcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLmlzSW5GaXJzdENvbnRlbnRPZkxpc3RJdGVtKSB7XG4gICAgICAgIHRva2VuaXplci5fZ2ZtVGFza2xpc3RGaXJzdENvbnRlbnRPZkxpc3RJdGVtID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICB0b2tlbml6ZXIud3JpdGUoc3RyZWFtKVxuXG4gICAgICBpZiAodG9rZW4uaXNJbkZpcnN0Q29udGVudE9mTGlzdEl0ZW0pIHtcbiAgICAgICAgdG9rZW5pemVyLl9nZm1UYXNrbGlzdEZpcnN0Q29udGVudE9mTGlzdEl0ZW0gPSB1bmRlZmluZWRcbiAgICAgIH1cbiAgICB9IC8vIFVucmF2ZWwgdGhlIG5leHQgdG9rZW4uXG5cbiAgICBwcmV2aW91cyA9IHRva2VuXG4gICAgdG9rZW4gPSB0b2tlbi5uZXh0XG4gIH0gLy8gTm93LCBsb29wIGJhY2sgdGhyb3VnaCBhbGwgZXZlbnRzIChhbmQgbGlua2VkIHRva2VucyksIHRvIGZpZ3VyZSBvdXQgd2hpY2hcbiAgLy8gcGFydHMgYmVsb25nIHdoZXJlLlxuXG4gIHRva2VuID0gcHJldmlvdXNcbiAgaW5kZXggPSBjaGlsZEV2ZW50cy5sZW5ndGhcblxuICB3aGlsZSAoaW5kZXgtLSkge1xuICAgIC8vIE1ha2Ugc3VyZSB3ZeKAmXZlIGF0IGxlYXN0IHNlZW4gc29tZXRoaW5nIChmaW5hbCBlb2wgaXMgcGFydCBvZiB0aGUgbGFzdFxuICAgIC8vIHRva2VuKS5cbiAgICBpZiAoY2hpbGRFdmVudHNbaW5kZXhdWzBdID09PSAnZW50ZXInKSB7XG4gICAgICBlbnRlcmVkID0gdHJ1ZVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICAvLyBGaW5kIGEgdm9pZCB0b2tlbiB0aGF0IGluY2x1ZGVzIGEgYnJlYWsuXG4gICAgICBlbnRlcmVkICYmXG4gICAgICBjaGlsZEV2ZW50c1tpbmRleF1bMV0udHlwZSA9PT0gY2hpbGRFdmVudHNbaW5kZXggLSAxXVsxXS50eXBlICYmXG4gICAgICBjaGlsZEV2ZW50c1tpbmRleF1bMV0uc3RhcnQubGluZSAhPT0gY2hpbGRFdmVudHNbaW5kZXhdWzFdLmVuZC5saW5lXG4gICAgKSB7XG4gICAgICBhZGQoY2hpbGRFdmVudHMuc2xpY2UoaW5kZXggKyAxLCBlbmQpKVxuICAgICAgLy8gSGVscCBHQy5cbiAgICAgIHRva2VuLl90b2tlbml6ZXIgPSB0b2tlbi5uZXh0ID0gdW5kZWZpbmVkXG4gICAgICB0b2tlbiA9IHRva2VuLnByZXZpb3VzXG4gICAgICBlbmQgPSBpbmRleCArIDFcbiAgICB9XG4gIH1cblxuICAvLyBIZWxwIEdDLlxuICB0b2tlbml6ZXIuZXZlbnRzID0gdG9rZW4uX3Rva2VuaXplciA9IHRva2VuLm5leHQgPSB1bmRlZmluZWQgLy8gRG8gaGVhZDpcblxuICBhZGQoY2hpbGRFdmVudHMuc2xpY2UoMCwgZW5kKSlcbiAgaW5kZXggPSAtMVxuICBhZGp1c3QgPSAwXG5cbiAgd2hpbGUgKCsraW5kZXggPCBqdW1wcy5sZW5ndGgpIHtcbiAgICBnYXBzW2FkanVzdCArIGp1bXBzW2luZGV4XVswXV0gPSBhZGp1c3QgKyBqdW1wc1tpbmRleF1bMV1cbiAgICBhZGp1c3QgKz0ganVtcHNbaW5kZXhdWzFdIC0ganVtcHNbaW5kZXhdWzBdIC0gMVxuICB9XG5cbiAgcmV0dXJuIGdhcHNcblxuICBmdW5jdGlvbiBhZGQoc2xpY2UpIHtcbiAgICB2YXIgc3RhcnQgPSBzdGFydFBvc2l0aW9ucy5wb3AoKVxuICAgIGp1bXBzLnVuc2hpZnQoW3N0YXJ0LCBzdGFydCArIHNsaWNlLmxlbmd0aCAtIDFdKVxuICAgIGNodW5rZWRTcGxpY2UoZXZlbnRzLCBzdGFydCwgMiwgc2xpY2UpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdWJ0b2tlbml6ZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBtYXJrZG93bkxpbmVFbmRpbmcgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmcuanMnKVxudmFyIHByZWZpeFNpemUgPSByZXF1aXJlKCcuLi91dGlsL3ByZWZpeC1zaXplLmpzJylcbnZhciBzdWJ0b2tlbml6ZSA9IHJlcXVpcmUoJy4uL3V0aWwvc3VidG9rZW5pemUuanMnKVxudmFyIGZhY3RvcnlTcGFjZSA9IHJlcXVpcmUoJy4vZmFjdG9yeS1zcGFjZS5qcycpXG5cbi8vIE5vIG5hbWUgYmVjYXVzZSBpdCBtdXN0IG5vdCBiZSB0dXJuZWQgb2ZmLlxudmFyIGNvbnRlbnQgPSB7XG4gIHRva2VuaXplOiB0b2tlbml6ZUNvbnRlbnQsXG4gIHJlc29sdmU6IHJlc29sdmVDb250ZW50LFxuICBpbnRlcnJ1cHRpYmxlOiB0cnVlLFxuICBsYXp5OiB0cnVlXG59XG52YXIgY29udGludWF0aW9uQ29uc3RydWN0ID0ge1xuICB0b2tlbml6ZTogdG9rZW5pemVDb250aW51YXRpb24sXG4gIHBhcnRpYWw6IHRydWVcbn0gLy8gQ29udGVudCBpcyB0cmFuc3BhcmVudDogaXTigJlzIHBhcnNlZCByaWdodCBub3cuIFRoYXQgd2F5LCBkZWZpbml0aW9ucyBhcmUgYWxzb1xuLy8gcGFyc2VkIHJpZ2h0IG5vdzogYmVmb3JlIHRleHQgaW4gcGFyYWdyYXBocyAoc3BlY2lmaWNhbGx5LCBtZWRpYSkgYXJlIHBhcnNlZC5cblxuZnVuY3Rpb24gcmVzb2x2ZUNvbnRlbnQoZXZlbnRzKSB7XG4gIHN1YnRva2VuaXplKGV2ZW50cylcbiAgcmV0dXJuIGV2ZW50c1xufVxuXG5mdW5jdGlvbiB0b2tlbml6ZUNvbnRlbnQoZWZmZWN0cywgb2spIHtcbiAgdmFyIHByZXZpb3VzXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdjb250ZW50JylcbiAgICBwcmV2aW91cyA9IGVmZmVjdHMuZW50ZXIoJ2NodW5rQ29udGVudCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnY29udGVudCdcbiAgICB9KVxuICAgIHJldHVybiBkYXRhKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBkYXRhKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGNvbnRlbnRFbmQoY29kZSlcbiAgICB9XG5cbiAgICBpZiAobWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICByZXR1cm4gZWZmZWN0cy5jaGVjayhcbiAgICAgICAgY29udGludWF0aW9uQ29uc3RydWN0LFxuICAgICAgICBjb250ZW50Q29udGludWUsXG4gICAgICAgIGNvbnRlbnRFbmRcbiAgICAgICkoY29kZSlcbiAgICB9IC8vIERhdGEuXG5cbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICByZXR1cm4gZGF0YVxuICB9XG5cbiAgZnVuY3Rpb24gY29udGVudEVuZChjb2RlKSB7XG4gICAgZWZmZWN0cy5leGl0KCdjaHVua0NvbnRlbnQnKVxuICAgIGVmZmVjdHMuZXhpdCgnY29udGVudCcpXG4gICAgcmV0dXJuIG9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb250ZW50Q29udGludWUoY29kZSkge1xuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIGVmZmVjdHMuZXhpdCgnY2h1bmtDb250ZW50JylcbiAgICBwcmV2aW91cyA9IHByZXZpb3VzLm5leHQgPSBlZmZlY3RzLmVudGVyKCdjaHVua0NvbnRlbnQnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ2NvbnRlbnQnLFxuICAgICAgcHJldmlvdXM6IHByZXZpb3VzXG4gICAgfSlcbiAgICByZXR1cm4gZGF0YVxuICB9XG59XG5cbmZ1bmN0aW9uIHRva2VuaXplQ29udGludWF0aW9uKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHJldHVybiBzdGFydExvb2thaGVhZFxuXG4gIGZ1bmN0aW9uIHN0YXJ0TG9va2FoZWFkKGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdsaW5lRW5kaW5nJylcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQoJ2xpbmVFbmRpbmcnKVxuICAgIHJldHVybiBmYWN0b3J5U3BhY2UoZWZmZWN0cywgcHJlZml4ZWQsICdsaW5lUHJlZml4JylcbiAgfVxuXG4gIGZ1bmN0aW9uIHByZWZpeGVkKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBzZWxmLnBhcnNlci5jb25zdHJ1Y3RzLmRpc2FibGUubnVsbC5pbmRleE9mKCdjb2RlSW5kZW50ZWQnKSA+IC0xIHx8XG4gICAgICBwcmVmaXhTaXplKHNlbGYuZXZlbnRzLCAnbGluZVByZWZpeCcpIDwgNFxuICAgICkge1xuICAgICAgcmV0dXJuIGVmZmVjdHMuaW50ZXJydXB0KHNlbGYucGFyc2VyLmNvbnN0cnVjdHMuZmxvdywgbm9rLCBvaykoY29kZSlcbiAgICB9XG5cbiAgICByZXR1cm4gb2soY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnRcbiIsIid1c2Ugc3RyaWN0J1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7dmFsdWU6IHRydWV9KVxuXG52YXIgY29udGVudCA9IHJlcXVpcmUoJy4uL3Rva2VuaXplL2NvbnRlbnQuanMnKVxudmFyIGZhY3RvcnlTcGFjZSA9IHJlcXVpcmUoJy4uL3Rva2VuaXplL2ZhY3Rvcnktc3BhY2UuanMnKVxudmFyIHBhcnRpYWxCbGFua0xpbmUgPSByZXF1aXJlKCcuLi90b2tlbml6ZS9wYXJ0aWFsLWJsYW5rLWxpbmUuanMnKVxuXG52YXIgdG9rZW5pemUgPSBpbml0aWFsaXplRmxvd1xuXG5mdW5jdGlvbiBpbml0aWFsaXplRmxvdyhlZmZlY3RzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICB2YXIgaW5pdGlhbCA9IGVmZmVjdHMuYXR0ZW1wdChcbiAgICAvLyBUcnkgdG8gcGFyc2UgYSBibGFuayBsaW5lLlxuICAgIHBhcnRpYWxCbGFua0xpbmUsXG4gICAgYXRCbGFua0VuZGluZywgLy8gVHJ5IHRvIHBhcnNlIGluaXRpYWwgZmxvdyAoZXNzZW50aWFsbHksIG9ubHkgY29kZSkuXG4gICAgZWZmZWN0cy5hdHRlbXB0KFxuICAgICAgdGhpcy5wYXJzZXIuY29uc3RydWN0cy5mbG93SW5pdGlhbCxcbiAgICAgIGFmdGVyQ29uc3RydWN0LFxuICAgICAgZmFjdG9yeVNwYWNlKFxuICAgICAgICBlZmZlY3RzLFxuICAgICAgICBlZmZlY3RzLmF0dGVtcHQoXG4gICAgICAgICAgdGhpcy5wYXJzZXIuY29uc3RydWN0cy5mbG93LFxuICAgICAgICAgIGFmdGVyQ29uc3RydWN0LFxuICAgICAgICAgIGVmZmVjdHMuYXR0ZW1wdChjb250ZW50LCBhZnRlckNvbnN0cnVjdClcbiAgICAgICAgKSxcbiAgICAgICAgJ2xpbmVQcmVmaXgnXG4gICAgICApXG4gICAgKVxuICApXG4gIHJldHVybiBpbml0aWFsXG5cbiAgZnVuY3Rpb24gYXRCbGFua0VuZGluZyhjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgZWZmZWN0cy5lbnRlcignbGluZUVuZGluZ0JsYW5rJylcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQoJ2xpbmVFbmRpbmdCbGFuaycpXG4gICAgc2VsZi5jdXJyZW50Q29uc3RydWN0ID0gdW5kZWZpbmVkXG4gICAgcmV0dXJuIGluaXRpYWxcbiAgfVxuXG4gIGZ1bmN0aW9uIGFmdGVyQ29uc3RydWN0KGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBlZmZlY3RzLmVudGVyKCdsaW5lRW5kaW5nJylcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQoJ2xpbmVFbmRpbmcnKVxuICAgIHNlbGYuY3VycmVudENvbnN0cnVjdCA9IHVuZGVmaW5lZFxuICAgIHJldHVybiBpbml0aWFsXG4gIH1cbn1cblxuZXhwb3J0cy50b2tlbml6ZSA9IHRva2VuaXplXG4iLCIndXNlIHN0cmljdCdcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge3ZhbHVlOiB0cnVlfSlcblxudmFyIGFzc2lnbiA9IHJlcXVpcmUoJy4uL2NvbnN0YW50L2Fzc2lnbi5qcycpXG52YXIgc2hhbGxvdyA9IHJlcXVpcmUoJy4uL3V0aWwvc2hhbGxvdy5qcycpXG5cbnZhciB0ZXh0ID0gaW5pdGlhbGl6ZUZhY3RvcnkoJ3RleHQnKVxudmFyIHN0cmluZyA9IGluaXRpYWxpemVGYWN0b3J5KCdzdHJpbmcnKVxudmFyIHJlc29sdmVyID0ge1xuICByZXNvbHZlQWxsOiBjcmVhdGVSZXNvbHZlcigpXG59XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVGYWN0b3J5KGZpZWxkKSB7XG4gIHJldHVybiB7XG4gICAgdG9rZW5pemU6IGluaXRpYWxpemVUZXh0LFxuICAgIHJlc29sdmVBbGw6IGNyZWF0ZVJlc29sdmVyKFxuICAgICAgZmllbGQgPT09ICd0ZXh0JyA/IHJlc29sdmVBbGxMaW5lU3VmZml4ZXMgOiB1bmRlZmluZWRcbiAgICApXG4gIH1cblxuICBmdW5jdGlvbiBpbml0aWFsaXplVGV4dChlZmZlY3RzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGNvbnN0cnVjdHMgPSB0aGlzLnBhcnNlci5jb25zdHJ1Y3RzW2ZpZWxkXVxuICAgIHZhciB0ZXh0ID0gZWZmZWN0cy5hdHRlbXB0KGNvbnN0cnVjdHMsIHN0YXJ0LCBub3RUZXh0KVxuICAgIHJldHVybiBzdGFydFxuXG4gICAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgICAgcmV0dXJuIGF0QnJlYWsoY29kZSkgPyB0ZXh0KGNvZGUpIDogbm90VGV4dChjb2RlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vdFRleHQoY29kZSkge1xuICAgICAgaWYgKGNvZGUgPT09IG51bGwpIHtcbiAgICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBlZmZlY3RzLmVudGVyKCdkYXRhJylcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXRhKGNvZGUpIHtcbiAgICAgIGlmIChhdEJyZWFrKGNvZGUpKSB7XG4gICAgICAgIGVmZmVjdHMuZXhpdCgnZGF0YScpXG4gICAgICAgIHJldHVybiB0ZXh0KGNvZGUpXG4gICAgICB9IC8vIERhdGEuXG5cbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhdEJyZWFrKGNvZGUpIHtcbiAgICAgIHZhciBsaXN0ID0gY29uc3RydWN0c1tjb2RlXVxuICAgICAgdmFyIGluZGV4ID0gLTFcblxuICAgICAgaWYgKGNvZGUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKGxpc3QpIHtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFsaXN0W2luZGV4XS5wcmV2aW91cyB8fFxuICAgICAgICAgICAgbGlzdFtpbmRleF0ucHJldmlvdXMuY2FsbChzZWxmLCBzZWxmLnByZXZpb3VzKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXIoZXh0cmFSZXNvbHZlcikge1xuICByZXR1cm4gcmVzb2x2ZUFsbFRleHRcblxuICBmdW5jdGlvbiByZXNvbHZlQWxsVGV4dChldmVudHMsIGNvbnRleHQpIHtcbiAgICB2YXIgaW5kZXggPSAtMVxuICAgIHZhciBlbnRlciAvLyBBIHJhdGhlciBib3JpbmcgY29tcHV0YXRpb24gKHRvIG1lcmdlIGFkamFjZW50IGBkYXRhYCBldmVudHMpIHdoaWNoXG4gICAgLy8gaW1wcm92ZXMgbW0gcGVyZm9ybWFuY2UgYnkgMjklLlxuXG4gICAgd2hpbGUgKCsraW5kZXggPD0gZXZlbnRzLmxlbmd0aCkge1xuICAgICAgaWYgKGVudGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGV2ZW50c1tpbmRleF0gJiYgZXZlbnRzW2luZGV4XVsxXS50eXBlID09PSAnZGF0YScpIHtcbiAgICAgICAgICBlbnRlciA9IGluZGV4XG4gICAgICAgICAgaW5kZXgrK1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFldmVudHNbaW5kZXhdIHx8IGV2ZW50c1tpbmRleF1bMV0udHlwZSAhPT0gJ2RhdGEnKSB7XG4gICAgICAgIC8vIERvbuKAmXQgZG8gYW55dGhpbmcgaWYgdGhlcmUgaXMgb25lIGRhdGEgdG9rZW4uXG4gICAgICAgIGlmIChpbmRleCAhPT0gZW50ZXIgKyAyKSB7XG4gICAgICAgICAgZXZlbnRzW2VudGVyXVsxXS5lbmQgPSBldmVudHNbaW5kZXggLSAxXVsxXS5lbmRcbiAgICAgICAgICBldmVudHMuc3BsaWNlKGVudGVyICsgMiwgaW5kZXggLSBlbnRlciAtIDIpXG4gICAgICAgICAgaW5kZXggPSBlbnRlciArIDJcbiAgICAgICAgfVxuXG4gICAgICAgIGVudGVyID0gdW5kZWZpbmVkXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4dHJhUmVzb2x2ZXIgPyBleHRyYVJlc29sdmVyKGV2ZW50cywgY29udGV4dCkgOiBldmVudHNcbiAgfVxufSAvLyBBIHJhdGhlciB1Z2x5IHNldCBvZiBpbnN0cnVjdGlvbnMgd2hpY2ggYWdhaW4gbG9va3MgYXQgY2h1bmtzIGluIHRoZSBpbnB1dFxuLy8gc3RyZWFtLlxuLy8gVGhlIHJlYXNvbiB0byBkbyB0aGlzIGhlcmUgaXMgdGhhdCBpdCBpcyAqbXVjaCogZmFzdGVyIHRvIHBhcnNlIGluIHJldmVyc2UuXG4vLyBBbmQgdGhhdCB3ZSBjYW7igJl0IGhvb2sgaW50byBgbnVsbGAgdG8gc3BsaXQgdGhlIGxpbmUgc3VmZml4IGJlZm9yZSBhbiBFT0YuXG4vLyBUbyBkbzogZmlndXJlIG91dCBpZiB3ZSBjYW4gbWFrZSB0aGlzIGludG8gYSBjbGVhbiB1dGlsaXR5LCBvciBldmVuIGluIGNvcmUuXG4vLyBBcyBpdCB3aWxsIGJlIHVzZWZ1bCBmb3IgR0ZNcyBsaXRlcmFsIGF1dG9saW5rIGV4dGVuc2lvbiAoYW5kIG1heWJlIGV2ZW5cbi8vIHRhYmxlcz8pXG5cbmZ1bmN0aW9uIHJlc29sdmVBbGxMaW5lU3VmZml4ZXMoZXZlbnRzLCBjb250ZXh0KSB7XG4gIHZhciBldmVudEluZGV4ID0gLTFcbiAgdmFyIGNodW5rc1xuICB2YXIgZGF0YVxuICB2YXIgY2h1bmtcbiAgdmFyIGluZGV4XG4gIHZhciBidWZmZXJJbmRleFxuICB2YXIgc2l6ZVxuICB2YXIgdGFic1xuICB2YXIgdG9rZW5cblxuICB3aGlsZSAoKytldmVudEluZGV4IDw9IGV2ZW50cy5sZW5ndGgpIHtcbiAgICBpZiAoXG4gICAgICAoZXZlbnRJbmRleCA9PT0gZXZlbnRzLmxlbmd0aCB8fFxuICAgICAgICBldmVudHNbZXZlbnRJbmRleF1bMV0udHlwZSA9PT0gJ2xpbmVFbmRpbmcnKSAmJlxuICAgICAgZXZlbnRzW2V2ZW50SW5kZXggLSAxXVsxXS50eXBlID09PSAnZGF0YSdcbiAgICApIHtcbiAgICAgIGRhdGEgPSBldmVudHNbZXZlbnRJbmRleCAtIDFdWzFdXG4gICAgICBjaHVua3MgPSBjb250ZXh0LnNsaWNlU3RyZWFtKGRhdGEpXG4gICAgICBpbmRleCA9IGNodW5rcy5sZW5ndGhcbiAgICAgIGJ1ZmZlckluZGV4ID0gLTFcbiAgICAgIHNpemUgPSAwXG4gICAgICB0YWJzID0gdW5kZWZpbmVkXG5cbiAgICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICAgIGNodW5rID0gY2h1bmtzW2luZGV4XVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2h1bmsgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgYnVmZmVySW5kZXggPSBjaHVuay5sZW5ndGhcblxuICAgICAgICAgIHdoaWxlIChjaHVuay5jaGFyQ29kZUF0KGJ1ZmZlckluZGV4IC0gMSkgPT09IDMyKSB7XG4gICAgICAgICAgICBzaXplKytcbiAgICAgICAgICAgIGJ1ZmZlckluZGV4LS1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYnVmZmVySW5kZXgpIGJyZWFrXG4gICAgICAgICAgYnVmZmVySW5kZXggPSAtMVxuICAgICAgICB9IC8vIE51bWJlclxuICAgICAgICBlbHNlIGlmIChjaHVuayA9PT0gLTIpIHtcbiAgICAgICAgICB0YWJzID0gdHJ1ZVxuICAgICAgICAgIHNpemUrK1xuICAgICAgICB9IGVsc2UgaWYgKGNodW5rID09PSAtMSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIC8vIFJlcGxhY2VtZW50IGNoYXJhY3RlciwgZXhpdC5cbiAgICAgICAgICBpbmRleCsrXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc2l6ZSkge1xuICAgICAgICB0b2tlbiA9IHtcbiAgICAgICAgICB0eXBlOlxuICAgICAgICAgICAgZXZlbnRJbmRleCA9PT0gZXZlbnRzLmxlbmd0aCB8fCB0YWJzIHx8IHNpemUgPCAyXG4gICAgICAgICAgICAgID8gJ2xpbmVTdWZmaXgnXG4gICAgICAgICAgICAgIDogJ2hhcmRCcmVha1RyYWlsaW5nJyxcbiAgICAgICAgICBzdGFydDoge1xuICAgICAgICAgICAgbGluZTogZGF0YS5lbmQubGluZSxcbiAgICAgICAgICAgIGNvbHVtbjogZGF0YS5lbmQuY29sdW1uIC0gc2l6ZSxcbiAgICAgICAgICAgIG9mZnNldDogZGF0YS5lbmQub2Zmc2V0IC0gc2l6ZSxcbiAgICAgICAgICAgIF9pbmRleDogZGF0YS5zdGFydC5faW5kZXggKyBpbmRleCxcbiAgICAgICAgICAgIF9idWZmZXJJbmRleDogaW5kZXhcbiAgICAgICAgICAgICAgPyBidWZmZXJJbmRleFxuICAgICAgICAgICAgICA6IGRhdGEuc3RhcnQuX2J1ZmZlckluZGV4ICsgYnVmZmVySW5kZXhcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVuZDogc2hhbGxvdyhkYXRhLmVuZClcbiAgICAgICAgfVxuICAgICAgICBkYXRhLmVuZCA9IHNoYWxsb3codG9rZW4uc3RhcnQpXG5cbiAgICAgICAgaWYgKGRhdGEuc3RhcnQub2Zmc2V0ID09PSBkYXRhLmVuZC5vZmZzZXQpIHtcbiAgICAgICAgICBhc3NpZ24oZGF0YSwgdG9rZW4pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXZlbnRzLnNwbGljZShcbiAgICAgICAgICAgIGV2ZW50SW5kZXgsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgWydlbnRlcicsIHRva2VuLCBjb250ZXh0XSxcbiAgICAgICAgICAgIFsnZXhpdCcsIHRva2VuLCBjb250ZXh0XVxuICAgICAgICAgIClcbiAgICAgICAgICBldmVudEluZGV4ICs9IDJcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBldmVudEluZGV4KytcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZXZlbnRzXG59XG5cbmV4cG9ydHMucmVzb2x2ZXIgPSByZXNvbHZlclxuZXhwb3J0cy5zdHJpbmcgPSBzdHJpbmdcbmV4cG9ydHMudGV4dCA9IHRleHRcbiIsIid1c2Ugc3RyaWN0J1xuXG5mdW5jdGlvbiBtaW5pZmxhdCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZFxuICAgID8gW11cbiAgICA6ICdsZW5ndGgnIGluIHZhbHVlXG4gICAgPyB2YWx1ZVxuICAgIDogW3ZhbHVlXVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1pbmlmbGF0XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGhhc093blByb3BlcnR5ID0gcmVxdWlyZSgnLi4vY29uc3RhbnQvaGFzLW93bi1wcm9wZXJ0eS5qcycpXG52YXIgY2h1bmtlZFNwbGljZSA9IHJlcXVpcmUoJy4vY2h1bmtlZC1zcGxpY2UuanMnKVxudmFyIG1pbmlmbGF0ID0gcmVxdWlyZSgnLi9taW5pZmxhdC5qcycpXG5cbmZ1bmN0aW9uIGNvbWJpbmVFeHRlbnNpb25zKGV4dGVuc2lvbnMpIHtcbiAgdmFyIGFsbCA9IHt9XG4gIHZhciBpbmRleCA9IC0xXG5cbiAgd2hpbGUgKCsraW5kZXggPCBleHRlbnNpb25zLmxlbmd0aCkge1xuICAgIGV4dGVuc2lvbihhbGwsIGV4dGVuc2lvbnNbaW5kZXhdKVxuICB9XG5cbiAgcmV0dXJuIGFsbFxufVxuXG5mdW5jdGlvbiBleHRlbnNpb24oYWxsLCBleHRlbnNpb24pIHtcbiAgdmFyIGhvb2tcbiAgdmFyIGxlZnRcbiAgdmFyIHJpZ2h0XG4gIHZhciBjb2RlXG5cbiAgZm9yIChob29rIGluIGV4dGVuc2lvbikge1xuICAgIGxlZnQgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKGFsbCwgaG9vaykgPyBhbGxbaG9va10gOiAoYWxsW2hvb2tdID0ge30pXG4gICAgcmlnaHQgPSBleHRlbnNpb25baG9va11cblxuICAgIGZvciAoY29kZSBpbiByaWdodCkge1xuICAgICAgbGVmdFtjb2RlXSA9IGNvbnN0cnVjdHMoXG4gICAgICAgIG1pbmlmbGF0KHJpZ2h0W2NvZGVdKSxcbiAgICAgICAgaGFzT3duUHJvcGVydHkuY2FsbChsZWZ0LCBjb2RlKSA/IGxlZnRbY29kZV0gOiBbXVxuICAgICAgKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RzKGxpc3QsIGV4aXN0aW5nKSB7XG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciBiZWZvcmUgPSBbXVxuXG4gIHdoaWxlICgrK2luZGV4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICA7KGxpc3RbaW5kZXhdLmFkZCA9PT0gJ2FmdGVyJyA/IGV4aXN0aW5nIDogYmVmb3JlKS5wdXNoKGxpc3RbaW5kZXhdKVxuICB9XG5cbiAgY2h1bmtlZFNwbGljZShleGlzdGluZywgMCwgMCwgYmVmb3JlKVxuICByZXR1cm4gZXhpc3Rpbmdcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb21iaW5lRXh0ZW5zaW9uc1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBjaHVua2VkU3BsaWNlID0gcmVxdWlyZSgnLi9jaHVua2VkLXNwbGljZS5qcycpXG5cbmZ1bmN0aW9uIGNodW5rZWRQdXNoKGxpc3QsIGl0ZW1zKSB7XG4gIGlmIChsaXN0Lmxlbmd0aCkge1xuICAgIGNodW5rZWRTcGxpY2UobGlzdCwgbGlzdC5sZW5ndGgsIDAsIGl0ZW1zKVxuICAgIHJldHVybiBsaXN0XG4gIH1cblxuICByZXR1cm4gaXRlbXNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjaHVua2VkUHVzaFxuIiwiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIHJlc29sdmVBbGwoY29uc3RydWN0cywgZXZlbnRzLCBjb250ZXh0KSB7XG4gIHZhciBjYWxsZWQgPSBbXVxuICB2YXIgaW5kZXggPSAtMVxuICB2YXIgcmVzb2x2ZVxuXG4gIHdoaWxlICgrK2luZGV4IDwgY29uc3RydWN0cy5sZW5ndGgpIHtcbiAgICByZXNvbHZlID0gY29uc3RydWN0c1tpbmRleF0ucmVzb2x2ZUFsbFxuXG4gICAgaWYgKHJlc29sdmUgJiYgY2FsbGVkLmluZGV4T2YocmVzb2x2ZSkgPCAwKSB7XG4gICAgICBldmVudHMgPSByZXNvbHZlKGV2ZW50cywgY29udGV4dClcbiAgICAgIGNhbGxlZC5wdXNoKHJlc29sdmUpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGV2ZW50c1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlc29sdmVBbGxcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgZnJvbUNoYXJDb2RlID0gcmVxdWlyZSgnLi4vY29uc3RhbnQvZnJvbS1jaGFyLWNvZGUuanMnKVxuXG5mdW5jdGlvbiBzZXJpYWxpemVDaHVua3MoY2h1bmtzKSB7XG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciByZXN1bHQgPSBbXVxuICB2YXIgY2h1bmtcbiAgdmFyIHZhbHVlXG4gIHZhciBhdFRhYlxuXG4gIHdoaWxlICgrK2luZGV4IDwgY2h1bmtzLmxlbmd0aCkge1xuICAgIGNodW5rID0gY2h1bmtzW2luZGV4XVxuXG4gICAgaWYgKHR5cGVvZiBjaHVuayA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gY2h1bmtcbiAgICB9IGVsc2UgaWYgKGNodW5rID09PSAtNSkge1xuICAgICAgdmFsdWUgPSAnXFxyJ1xuICAgIH0gZWxzZSBpZiAoY2h1bmsgPT09IC00KSB7XG4gICAgICB2YWx1ZSA9ICdcXG4nXG4gICAgfSBlbHNlIGlmIChjaHVuayA9PT0gLTMpIHtcbiAgICAgIHZhbHVlID0gJ1xccicgKyAnXFxuJ1xuICAgIH0gZWxzZSBpZiAoY2h1bmsgPT09IC0yKSB7XG4gICAgICB2YWx1ZSA9ICdcXHQnXG4gICAgfSBlbHNlIGlmIChjaHVuayA9PT0gLTEpIHtcbiAgICAgIGlmIChhdFRhYikgY29udGludWVcbiAgICAgIHZhbHVlID0gJyAnXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEN1cnJlbnRseSBvbmx5IHJlcGxhY2VtZW50IGNoYXJhY3Rlci5cbiAgICAgIHZhbHVlID0gZnJvbUNoYXJDb2RlKGNodW5rKVxuICAgIH1cblxuICAgIGF0VGFiID0gY2h1bmsgPT09IC0yXG4gICAgcmVzdWx0LnB1c2godmFsdWUpXG4gIH1cblxuICByZXR1cm4gcmVzdWx0LmpvaW4oJycpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2VyaWFsaXplQ2h1bmtzXG4iLCIndXNlIHN0cmljdCdcblxuZnVuY3Rpb24gc2xpY2VDaHVua3MoY2h1bmtzLCB0b2tlbikge1xuICB2YXIgc3RhcnRJbmRleCA9IHRva2VuLnN0YXJ0Ll9pbmRleFxuICB2YXIgc3RhcnRCdWZmZXJJbmRleCA9IHRva2VuLnN0YXJ0Ll9idWZmZXJJbmRleFxuICB2YXIgZW5kSW5kZXggPSB0b2tlbi5lbmQuX2luZGV4XG4gIHZhciBlbmRCdWZmZXJJbmRleCA9IHRva2VuLmVuZC5fYnVmZmVySW5kZXhcbiAgdmFyIHZpZXdcblxuICBpZiAoc3RhcnRJbmRleCA9PT0gZW5kSW5kZXgpIHtcbiAgICB2aWV3ID0gW2NodW5rc1tzdGFydEluZGV4XS5zbGljZShzdGFydEJ1ZmZlckluZGV4LCBlbmRCdWZmZXJJbmRleCldXG4gIH0gZWxzZSB7XG4gICAgdmlldyA9IGNodW5rcy5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleClcblxuICAgIGlmIChzdGFydEJ1ZmZlckluZGV4ID4gLTEpIHtcbiAgICAgIHZpZXdbMF0gPSB2aWV3WzBdLnNsaWNlKHN0YXJ0QnVmZmVySW5kZXgpXG4gICAgfVxuXG4gICAgaWYgKGVuZEJ1ZmZlckluZGV4ID4gMCkge1xuICAgICAgdmlldy5wdXNoKGNodW5rc1tlbmRJbmRleF0uc2xpY2UoMCwgZW5kQnVmZmVySW5kZXgpKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB2aWV3XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2xpY2VDaHVua3NcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYXNzaWduID0gcmVxdWlyZSgnLi4vY29uc3RhbnQvYXNzaWduLmpzJylcbnZhciBtYXJrZG93bkxpbmVFbmRpbmcgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmcuanMnKVxudmFyIGNodW5rZWRQdXNoID0gcmVxdWlyZSgnLi9jaHVua2VkLXB1c2guanMnKVxudmFyIGNodW5rZWRTcGxpY2UgPSByZXF1aXJlKCcuL2NodW5rZWQtc3BsaWNlLmpzJylcbnZhciBtaW5pZmxhdCA9IHJlcXVpcmUoJy4vbWluaWZsYXQuanMnKVxudmFyIHJlc29sdmVBbGwgPSByZXF1aXJlKCcuL3Jlc29sdmUtYWxsLmpzJylcbnZhciBzZXJpYWxpemVDaHVua3MgPSByZXF1aXJlKCcuL3NlcmlhbGl6ZS1jaHVua3MuanMnKVxudmFyIHNoYWxsb3cgPSByZXF1aXJlKCcuL3NoYWxsb3cuanMnKVxudmFyIHNsaWNlQ2h1bmtzID0gcmVxdWlyZSgnLi9zbGljZS1jaHVua3MuanMnKVxuXG4vLyBDcmVhdGUgYSB0b2tlbml6ZXIuXG4vLyBUb2tlbml6ZXJzIGRlYWwgd2l0aCBvbmUgdHlwZSBvZiBkYXRhIChlLmcuLCBjb250YWluZXJzLCBmbG93LCB0ZXh0KS5cbi8vIFRoZSBwYXJzZXIgaXMgdGhlIG9iamVjdCBkZWFsaW5nIHdpdGggaXQgYWxsLlxuLy8gYGluaXRpYWxpemVgIHdvcmtzIGxpa2Ugb3RoZXIgY29uc3RydWN0cywgZXhjZXB0IHRoYXQgb25seSBpdHMgYHRva2VuaXplYFxuLy8gZnVuY3Rpb24gaXMgdXNlZCwgaW4gd2hpY2ggY2FzZSBpdCBkb2VzbuKAmXQgcmVjZWl2ZSBhbiBgb2tgIG9yIGBub2tgLlxuLy8gYGZyb21gIGNhbiBiZSBnaXZlbiB0byBzZXQgdGhlIHBvaW50IGJlZm9yZSB0aGUgZmlyc3QgY2hhcmFjdGVyLCBhbHRob3VnaFxuLy8gd2hlbiBmdXJ0aGVyIGxpbmVzIGFyZSBpbmRlbnRlZCwgdGhleSBtdXN0IGJlIHNldCB3aXRoIGBkZWZpbmVTa2lwYC5cbmZ1bmN0aW9uIGNyZWF0ZVRva2VuaXplcihwYXJzZXIsIGluaXRpYWxpemUsIGZyb20pIHtcbiAgdmFyIHBvaW50ID0gZnJvbVxuICAgID8gc2hhbGxvdyhmcm9tKVxuICAgIDoge1xuICAgICAgICBsaW5lOiAxLFxuICAgICAgICBjb2x1bW46IDEsXG4gICAgICAgIG9mZnNldDogMFxuICAgICAgfVxuICB2YXIgY29sdW1uU3RhcnQgPSB7fVxuICB2YXIgcmVzb2x2ZUFsbENvbnN0cnVjdHMgPSBbXVxuICB2YXIgY2h1bmtzID0gW11cbiAgdmFyIHN0YWNrID0gW11cblxuICB2YXIgZWZmZWN0cyA9IHtcbiAgICBjb25zdW1lOiBjb25zdW1lLFxuICAgIGVudGVyOiBlbnRlcixcbiAgICBleGl0OiBleGl0LFxuICAgIGF0dGVtcHQ6IGNvbnN0cnVjdEZhY3Rvcnkob25zdWNjZXNzZnVsY29uc3RydWN0KSxcbiAgICBjaGVjazogY29uc3RydWN0RmFjdG9yeShvbnN1Y2Nlc3NmdWxjaGVjayksXG4gICAgaW50ZXJydXB0OiBjb25zdHJ1Y3RGYWN0b3J5KG9uc3VjY2Vzc2Z1bGNoZWNrLCB7XG4gICAgICBpbnRlcnJ1cHQ6IHRydWVcbiAgICB9KSxcbiAgICBsYXp5OiBjb25zdHJ1Y3RGYWN0b3J5KG9uc3VjY2Vzc2Z1bGNoZWNrLCB7XG4gICAgICBsYXp5OiB0cnVlXG4gICAgfSlcbiAgfSAvLyBTdGF0ZSBhbmQgdG9vbHMgZm9yIHJlc29sdmluZyBhbmQgc2VyaWFsaXppbmcuXG5cbiAgdmFyIGNvbnRleHQgPSB7XG4gICAgcHJldmlvdXM6IG51bGwsXG4gICAgZXZlbnRzOiBbXSxcbiAgICBwYXJzZXI6IHBhcnNlcixcbiAgICBzbGljZVN0cmVhbTogc2xpY2VTdHJlYW0sXG4gICAgc2xpY2VTZXJpYWxpemU6IHNsaWNlU2VyaWFsaXplLFxuICAgIG5vdzogbm93LFxuICAgIGRlZmluZVNraXA6IHNraXAsXG4gICAgd3JpdGU6IHdyaXRlXG4gIH0gLy8gVGhlIHN0YXRlIGZ1bmN0aW9uLlxuXG4gIHZhciBzdGF0ZSA9IGluaXRpYWxpemUudG9rZW5pemUuY2FsbChjb250ZXh0LCBlZmZlY3RzKSAvLyBUcmFjayB3aGljaCBjaGFyYWN0ZXIgd2UgZXhwZWN0IHRvIGJlIGNvbnN1bWVkLCB0byBjYXRjaCBidWdzLlxuXG4gIGlmIChpbml0aWFsaXplLnJlc29sdmVBbGwpIHtcbiAgICByZXNvbHZlQWxsQ29uc3RydWN0cy5wdXNoKGluaXRpYWxpemUpXG4gIH0gLy8gU3RvcmUgd2hlcmUgd2UgYXJlIGluIHRoZSBpbnB1dCBzdHJlYW0uXG5cbiAgcG9pbnQuX2luZGV4ID0gMFxuICBwb2ludC5fYnVmZmVySW5kZXggPSAtMVxuICByZXR1cm4gY29udGV4dFxuXG4gIGZ1bmN0aW9uIHdyaXRlKHNsaWNlKSB7XG4gICAgY2h1bmtzID0gY2h1bmtlZFB1c2goY2h1bmtzLCBzbGljZSlcbiAgICBtYWluKCkgLy8gRXhpdCBpZiB3ZeKAmXJlIG5vdCBkb25lLCByZXNvbHZlIG1pZ2h0IGNoYW5nZSBzdHVmZi5cblxuICAgIGlmIChjaHVua3NbY2h1bmtzLmxlbmd0aCAtIDFdICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gW11cbiAgICB9XG5cbiAgICBhZGRSZXN1bHQoaW5pdGlhbGl6ZSwgMCkgLy8gT3RoZXJ3aXNlLCByZXNvbHZlLCBhbmQgZXhpdC5cblxuICAgIGNvbnRleHQuZXZlbnRzID0gcmVzb2x2ZUFsbChyZXNvbHZlQWxsQ29uc3RydWN0cywgY29udGV4dC5ldmVudHMsIGNvbnRleHQpXG4gICAgcmV0dXJuIGNvbnRleHQuZXZlbnRzXG4gIH0gLy9cbiAgLy8gVG9vbHMuXG4gIC8vXG5cbiAgZnVuY3Rpb24gc2xpY2VTZXJpYWxpemUodG9rZW4pIHtcbiAgICByZXR1cm4gc2VyaWFsaXplQ2h1bmtzKHNsaWNlU3RyZWFtKHRva2VuKSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNsaWNlU3RyZWFtKHRva2VuKSB7XG4gICAgcmV0dXJuIHNsaWNlQ2h1bmtzKGNodW5rcywgdG9rZW4pXG4gIH1cblxuICBmdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIHNoYWxsb3cocG9pbnQpXG4gIH1cblxuICBmdW5jdGlvbiBza2lwKHZhbHVlKSB7XG4gICAgY29sdW1uU3RhcnRbdmFsdWUubGluZV0gPSB2YWx1ZS5jb2x1bW5cbiAgICBhY2NvdW50Rm9yUG90ZW50aWFsU2tpcCgpXG4gIH0gLy9cbiAgLy8gU3RhdGUgbWFuYWdlbWVudC5cbiAgLy9cbiAgLy8gTWFpbiBsb29wIChub3RlIHRoYXQgYF9pbmRleGAgYW5kIGBfYnVmZmVySW5kZXhgIGluIGBwb2ludGAgYXJlIG1vZGlmaWVkIGJ5XG4gIC8vIGBjb25zdW1lYCkuXG4gIC8vIEhlcmUgaXMgd2hlcmUgd2Ugd2FsayB0aHJvdWdoIHRoZSBjaHVua3MsIHdoaWNoIGVpdGhlciBpbmNsdWRlIHN0cmluZ3Mgb2ZcbiAgLy8gc2V2ZXJhbCBjaGFyYWN0ZXJzLCBvciBudW1lcmljYWwgY2hhcmFjdGVyIGNvZGVzLlxuICAvLyBUaGUgcmVhc29uIHRvIGRvIHRoaXMgaW4gYSBsb29wIGluc3RlYWQgb2YgYSBjYWxsIGlzIHNvIHRoZSBzdGFjayBjYW5cbiAgLy8gZHJhaW4uXG5cbiAgZnVuY3Rpb24gbWFpbigpIHtcbiAgICB2YXIgY2h1bmtJbmRleFxuICAgIHZhciBjaHVua1xuXG4gICAgd2hpbGUgKHBvaW50Ll9pbmRleCA8IGNodW5rcy5sZW5ndGgpIHtcbiAgICAgIGNodW5rID0gY2h1bmtzW3BvaW50Ll9pbmRleF0gLy8gSWYgd2XigJlyZSBpbiBhIGJ1ZmZlciBjaHVuaywgbG9vcCB0aHJvdWdoIGl0LlxuXG4gICAgICBpZiAodHlwZW9mIGNodW5rID09PSAnc3RyaW5nJykge1xuICAgICAgICBjaHVua0luZGV4ID0gcG9pbnQuX2luZGV4XG5cbiAgICAgICAgaWYgKHBvaW50Ll9idWZmZXJJbmRleCA8IDApIHtcbiAgICAgICAgICBwb2ludC5fYnVmZmVySW5kZXggPSAwXG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoXG4gICAgICAgICAgcG9pbnQuX2luZGV4ID09PSBjaHVua0luZGV4ICYmXG4gICAgICAgICAgcG9pbnQuX2J1ZmZlckluZGV4IDwgY2h1bmsubGVuZ3RoXG4gICAgICAgICkge1xuICAgICAgICAgIGdvKGNodW5rLmNoYXJDb2RlQXQocG9pbnQuX2J1ZmZlckluZGV4KSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ28oY2h1bmspXG4gICAgICB9XG4gICAgfVxuICB9IC8vIERlYWwgd2l0aCBvbmUgY29kZS5cblxuICBmdW5jdGlvbiBnbyhjb2RlKSB7XG4gICAgc3RhdGUgPSBzdGF0ZShjb2RlKVxuICB9IC8vIE1vdmUgYSBjaGFyYWN0ZXIgZm9yd2FyZC5cblxuICBmdW5jdGlvbiBjb25zdW1lKGNvZGUpIHtcbiAgICBpZiAobWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBwb2ludC5saW5lKytcbiAgICAgIHBvaW50LmNvbHVtbiA9IDFcbiAgICAgIHBvaW50Lm9mZnNldCArPSBjb2RlID09PSAtMyA/IDIgOiAxXG4gICAgICBhY2NvdW50Rm9yUG90ZW50aWFsU2tpcCgpXG4gICAgfSBlbHNlIGlmIChjb2RlICE9PSAtMSkge1xuICAgICAgcG9pbnQuY29sdW1uKytcbiAgICAgIHBvaW50Lm9mZnNldCsrXG4gICAgfSAvLyBOb3QgaW4gYSBzdHJpbmcgY2h1bmsuXG5cbiAgICBpZiAocG9pbnQuX2J1ZmZlckluZGV4IDwgMCkge1xuICAgICAgcG9pbnQuX2luZGV4KytcbiAgICB9IGVsc2Uge1xuICAgICAgcG9pbnQuX2J1ZmZlckluZGV4KysgLy8gQXQgZW5kIG9mIHN0cmluZyBjaHVuay5cblxuICAgICAgaWYgKHBvaW50Ll9idWZmZXJJbmRleCA9PT0gY2h1bmtzW3BvaW50Ll9pbmRleF0ubGVuZ3RoKSB7XG4gICAgICAgIHBvaW50Ll9idWZmZXJJbmRleCA9IC0xXG4gICAgICAgIHBvaW50Ll9pbmRleCsrXG4gICAgICB9XG4gICAgfSAvLyBFeHBvc2UgdGhlIHByZXZpb3VzIGNoYXJhY3Rlci5cblxuICAgIGNvbnRleHQucHJldmlvdXMgPSBjb2RlIC8vIE1hcmsgYXMgY29uc3VtZWQuXG4gIH0gLy8gU3RhcnQgYSB0b2tlbi5cblxuICBmdW5jdGlvbiBlbnRlcih0eXBlLCBmaWVsZHMpIHtcbiAgICB2YXIgdG9rZW4gPSBmaWVsZHMgfHwge31cbiAgICB0b2tlbi50eXBlID0gdHlwZVxuICAgIHRva2VuLnN0YXJ0ID0gbm93KClcbiAgICBjb250ZXh0LmV2ZW50cy5wdXNoKFsnZW50ZXInLCB0b2tlbiwgY29udGV4dF0pXG4gICAgc3RhY2sucHVzaCh0b2tlbilcbiAgICByZXR1cm4gdG9rZW5cbiAgfSAvLyBTdG9wIGEgdG9rZW4uXG5cbiAgZnVuY3Rpb24gZXhpdCh0eXBlKSB7XG4gICAgdmFyIHRva2VuID0gc3RhY2sucG9wKClcbiAgICB0b2tlbi5lbmQgPSBub3coKVxuICAgIGNvbnRleHQuZXZlbnRzLnB1c2goWydleGl0JywgdG9rZW4sIGNvbnRleHRdKVxuICAgIHJldHVybiB0b2tlblxuICB9IC8vIFVzZSByZXN1bHRzLlxuXG4gIGZ1bmN0aW9uIG9uc3VjY2Vzc2Z1bGNvbnN0cnVjdChjb25zdHJ1Y3QsIGluZm8pIHtcbiAgICBhZGRSZXN1bHQoY29uc3RydWN0LCBpbmZvLmZyb20pXG4gIH0gLy8gRGlzY2FyZCByZXN1bHRzLlxuXG4gIGZ1bmN0aW9uIG9uc3VjY2Vzc2Z1bGNoZWNrKGNvbnN0cnVjdCwgaW5mbykge1xuICAgIGluZm8ucmVzdG9yZSgpXG4gIH0gLy8gRmFjdG9yeSB0byBhdHRlbXB0L2NoZWNrL2ludGVycnVwdC5cblxuICBmdW5jdGlvbiBjb25zdHJ1Y3RGYWN0b3J5KG9ucmV0dXJuLCBmaWVsZHMpIHtcbiAgICByZXR1cm4gaG9vayAvLyBIYW5kbGUgZWl0aGVyIGFuIG9iamVjdCBtYXBwaW5nIGNvZGVzIHRvIGNvbnN0cnVjdHMsIGEgbGlzdCBvZlxuICAgIC8vIGNvbnN0cnVjdHMsIG9yIGEgc2luZ2xlIGNvbnN0cnVjdC5cblxuICAgIGZ1bmN0aW9uIGhvb2soY29uc3RydWN0cywgcmV0dXJuU3RhdGUsIGJvZ3VzU3RhdGUpIHtcbiAgICAgIHZhciBsaXN0T2ZDb25zdHJ1Y3RzXG4gICAgICB2YXIgY29uc3RydWN0SW5kZXhcbiAgICAgIHZhciBjdXJyZW50Q29uc3RydWN0XG4gICAgICB2YXIgaW5mb1xuICAgICAgcmV0dXJuIGNvbnN0cnVjdHMudG9rZW5pemUgfHwgJ2xlbmd0aCcgaW4gY29uc3RydWN0c1xuICAgICAgICA/IGhhbmRsZUxpc3RPZkNvbnN0cnVjdHMobWluaWZsYXQoY29uc3RydWN0cykpXG4gICAgICAgIDogaGFuZGxlTWFwT2ZDb25zdHJ1Y3RzXG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZU1hcE9mQ29uc3RydWN0cyhjb2RlKSB7XG4gICAgICAgIGlmIChjb2RlIGluIGNvbnN0cnVjdHMgfHwgbnVsbCBpbiBjb25zdHJ1Y3RzKSB7XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZUxpc3RPZkNvbnN0cnVjdHMoXG4gICAgICAgICAgICBjb25zdHJ1Y3RzLm51bGxcbiAgICAgICAgICAgICAgPyAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICAgIG1pbmlmbGF0KGNvbnN0cnVjdHNbY29kZV0pLmNvbmNhdChtaW5pZmxhdChjb25zdHJ1Y3RzLm51bGwpKVxuICAgICAgICAgICAgICA6IGNvbnN0cnVjdHNbY29kZV1cbiAgICAgICAgICApKGNvZGUpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYm9ndXNTdGF0ZShjb2RlKVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBoYW5kbGVMaXN0T2ZDb25zdHJ1Y3RzKGxpc3QpIHtcbiAgICAgICAgbGlzdE9mQ29uc3RydWN0cyA9IGxpc3RcbiAgICAgICAgY29uc3RydWN0SW5kZXggPSAwXG4gICAgICAgIHJldHVybiBoYW5kbGVDb25zdHJ1Y3QobGlzdFtjb25zdHJ1Y3RJbmRleF0pXG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZUNvbnN0cnVjdChjb25zdHJ1Y3QpIHtcbiAgICAgICAgcmV0dXJuIHN0YXJ0XG5cbiAgICAgICAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgICAgICAgIC8vIFRvIGRvOiBub3QgbmVkZSB0byBzdG9yZSBpZiB0aGVyZSBpcyBubyBib2d1cyBzdGF0ZSwgcHJvYmFibHk/XG4gICAgICAgICAgLy8gQ3VycmVudGx5IGRvZXNu4oCZdCB3b3JrIGJlY2F1c2UgYGluc3BlY3RgIGluIGRvY3VtZW50IGRvZXMgYSBjaGVja1xuICAgICAgICAgIC8vIHcvbyBhIGJvZ3VzLCB3aGljaCBkb2VzbuKAmXQgbWFrZSBzZW5zZS4gQnV0IGl0IGRvZXMgc2VlbSB0byBoZWxwIHBlcmZcbiAgICAgICAgICAvLyBieSBub3Qgc3RvcmluZy5cbiAgICAgICAgICBpbmZvID0gc3RvcmUoKVxuICAgICAgICAgIGN1cnJlbnRDb25zdHJ1Y3QgPSBjb25zdHJ1Y3RcblxuICAgICAgICAgIGlmICghY29uc3RydWN0LnBhcnRpYWwpIHtcbiAgICAgICAgICAgIGNvbnRleHQuY3VycmVudENvbnN0cnVjdCA9IGNvbnN0cnVjdFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGNvbnN0cnVjdC5uYW1lICYmXG4gICAgICAgICAgICBjb250ZXh0LnBhcnNlci5jb25zdHJ1Y3RzLmRpc2FibGUubnVsbC5pbmRleE9mKGNvbnN0cnVjdC5uYW1lKSA+IC0xXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9rKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gY29uc3RydWN0LnRva2VuaXplLmNhbGwoXG4gICAgICAgICAgICBmaWVsZHMgPyBhc3NpZ24oe30sIGNvbnRleHQsIGZpZWxkcykgOiBjb250ZXh0LFxuICAgICAgICAgICAgZWZmZWN0cyxcbiAgICAgICAgICAgIG9rLFxuICAgICAgICAgICAgbm9rXG4gICAgICAgICAgKShjb2RlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9rKGNvZGUpIHtcbiAgICAgICAgb25yZXR1cm4oY3VycmVudENvbnN0cnVjdCwgaW5mbylcbiAgICAgICAgcmV0dXJuIHJldHVyblN0YXRlXG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG5vayhjb2RlKSB7XG4gICAgICAgIGluZm8ucmVzdG9yZSgpXG5cbiAgICAgICAgaWYgKCsrY29uc3RydWN0SW5kZXggPCBsaXN0T2ZDb25zdHJ1Y3RzLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBoYW5kbGVDb25zdHJ1Y3QobGlzdE9mQ29uc3RydWN0c1tjb25zdHJ1Y3RJbmRleF0pXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYm9ndXNTdGF0ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFJlc3VsdChjb25zdHJ1Y3QsIGZyb20pIHtcbiAgICBpZiAoY29uc3RydWN0LnJlc29sdmVBbGwgJiYgcmVzb2x2ZUFsbENvbnN0cnVjdHMuaW5kZXhPZihjb25zdHJ1Y3QpIDwgMCkge1xuICAgICAgcmVzb2x2ZUFsbENvbnN0cnVjdHMucHVzaChjb25zdHJ1Y3QpXG4gICAgfVxuXG4gICAgaWYgKGNvbnN0cnVjdC5yZXNvbHZlKSB7XG4gICAgICBjaHVua2VkU3BsaWNlKFxuICAgICAgICBjb250ZXh0LmV2ZW50cyxcbiAgICAgICAgZnJvbSxcbiAgICAgICAgY29udGV4dC5ldmVudHMubGVuZ3RoIC0gZnJvbSxcbiAgICAgICAgY29uc3RydWN0LnJlc29sdmUoY29udGV4dC5ldmVudHMuc2xpY2UoZnJvbSksIGNvbnRleHQpXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKGNvbnN0cnVjdC5yZXNvbHZlVG8pIHtcbiAgICAgIGNvbnRleHQuZXZlbnRzID0gY29uc3RydWN0LnJlc29sdmVUbyhjb250ZXh0LmV2ZW50cywgY29udGV4dClcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzdG9yZSgpIHtcbiAgICB2YXIgc3RhcnRQb2ludCA9IG5vdygpXG4gICAgdmFyIHN0YXJ0UHJldmlvdXMgPSBjb250ZXh0LnByZXZpb3VzXG4gICAgdmFyIHN0YXJ0Q3VycmVudENvbnN0cnVjdCA9IGNvbnRleHQuY3VycmVudENvbnN0cnVjdFxuICAgIHZhciBzdGFydEV2ZW50c0luZGV4ID0gY29udGV4dC5ldmVudHMubGVuZ3RoXG4gICAgdmFyIHN0YXJ0U3RhY2sgPSBBcnJheS5mcm9tKHN0YWNrKVxuICAgIHJldHVybiB7XG4gICAgICByZXN0b3JlOiByZXN0b3JlLFxuICAgICAgZnJvbTogc3RhcnRFdmVudHNJbmRleFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc3RvcmUoKSB7XG4gICAgICBwb2ludCA9IHN0YXJ0UG9pbnRcbiAgICAgIGNvbnRleHQucHJldmlvdXMgPSBzdGFydFByZXZpb3VzXG4gICAgICBjb250ZXh0LmN1cnJlbnRDb25zdHJ1Y3QgPSBzdGFydEN1cnJlbnRDb25zdHJ1Y3RcbiAgICAgIGNvbnRleHQuZXZlbnRzLmxlbmd0aCA9IHN0YXJ0RXZlbnRzSW5kZXhcbiAgICAgIHN0YWNrID0gc3RhcnRTdGFja1xuICAgICAgYWNjb3VudEZvclBvdGVudGlhbFNraXAoKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFjY291bnRGb3JQb3RlbnRpYWxTa2lwKCkge1xuICAgIGlmIChwb2ludC5saW5lIGluIGNvbHVtblN0YXJ0ICYmIHBvaW50LmNvbHVtbiA8IDIpIHtcbiAgICAgIHBvaW50LmNvbHVtbiA9IGNvbHVtblN0YXJ0W3BvaW50LmxpbmVdXG4gICAgICBwb2ludC5vZmZzZXQgKz0gY29sdW1uU3RhcnRbcG9pbnQubGluZV0gLSAxXG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlVG9rZW5pemVyXG4iLCIndXNlIHN0cmljdCdcblxuZnVuY3Rpb24gbWFya2Rvd25MaW5lRW5kaW5nT3JTcGFjZShjb2RlKSB7XG4gIHJldHVybiBjb2RlIDwgMCB8fCBjb2RlID09PSAzMlxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2VcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgZnJvbUNoYXJDb2RlID0gcmVxdWlyZSgnLi4vY29uc3RhbnQvZnJvbS1jaGFyLWNvZGUuanMnKVxuXG5mdW5jdGlvbiByZWdleENoZWNrKHJlZ2V4KSB7XG4gIHJldHVybiBjaGVja1xuXG4gIGZ1bmN0aW9uIGNoZWNrKGNvZGUpIHtcbiAgICByZXR1cm4gcmVnZXgudGVzdChmcm9tQ2hhckNvZGUoY29kZSkpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZWdleENoZWNrXG4iLCIndXNlIHN0cmljdCdcblxudmFyIHVuaWNvZGVQdW5jdHVhdGlvblJlZ2V4ID0gcmVxdWlyZSgnLi4vY29uc3RhbnQvdW5pY29kZS1wdW5jdHVhdGlvbi1yZWdleC5qcycpXG52YXIgcmVnZXhDaGVjayA9IHJlcXVpcmUoJy4uL3V0aWwvcmVnZXgtY2hlY2suanMnKVxuXG4vLyBJbiBmYWN0IGFkZHMgdG8gdGhlIGJ1bmRsZSBzaXplLlxuXG52YXIgdW5pY29kZVB1bmN0dWF0aW9uID0gcmVnZXhDaGVjayh1bmljb2RlUHVuY3R1YXRpb25SZWdleClcblxubW9kdWxlLmV4cG9ydHMgPSB1bmljb2RlUHVuY3R1YXRpb25cbiIsIid1c2Ugc3RyaWN0J1xuXG4vLyBUaGlzIG1vZHVsZSBpcyBnZW5lcmF0ZWQgYnkgYHNjcmlwdC9gLlxuLy9cbi8vIENvbW1vbk1hcmsgaGFuZGxlcyBhdHRlbnRpb24gKGVtcGhhc2lzLCBzdHJvbmcpIG1hcmtlcnMgYmFzZWQgb24gd2hhdCBjb21lc1xuLy8gYmVmb3JlIG9yIGFmdGVyIHRoZW0uXG4vLyBPbmUgc3VjaCBkaWZmZXJlbmNlIGlzIGlmIHRob3NlIGNoYXJhY3RlcnMgYXJlIFVuaWNvZGUgcHVuY3R1YXRpb24uXG4vLyBUaGlzIHNjcmlwdCBpcyBnZW5lcmF0ZWQgZnJvbSB0aGUgVW5pY29kZSBkYXRhLlxudmFyIHVuaWNvZGVQdW5jdHVhdGlvbiA9IC9bIS1cXC86LUBcXFstYFxcey1+XFx4QTFcXHhBN1xceEFCXFx4QjZcXHhCN1xceEJCXFx4QkZcXHUwMzdFXFx1MDM4N1xcdTA1NUEtXFx1MDU1RlxcdTA1ODlcXHUwNThBXFx1MDVCRVxcdTA1QzBcXHUwNUMzXFx1MDVDNlxcdTA1RjNcXHUwNUY0XFx1MDYwOVxcdTA2MEFcXHUwNjBDXFx1MDYwRFxcdTA2MUJcXHUwNjFFXFx1MDYxRlxcdTA2NkEtXFx1MDY2RFxcdTA2RDRcXHUwNzAwLVxcdTA3MERcXHUwN0Y3LVxcdTA3RjlcXHUwODMwLVxcdTA4M0VcXHUwODVFXFx1MDk2NFxcdTA5NjVcXHUwOTcwXFx1MDlGRFxcdTBBNzZcXHUwQUYwXFx1MEM3N1xcdTBDODRcXHUwREY0XFx1MEU0RlxcdTBFNUFcXHUwRTVCXFx1MEYwNC1cXHUwRjEyXFx1MEYxNFxcdTBGM0EtXFx1MEYzRFxcdTBGODVcXHUwRkQwLVxcdTBGRDRcXHUwRkQ5XFx1MEZEQVxcdTEwNEEtXFx1MTA0RlxcdTEwRkJcXHUxMzYwLVxcdTEzNjhcXHUxNDAwXFx1MTY2RVxcdTE2OUJcXHUxNjlDXFx1MTZFQi1cXHUxNkVEXFx1MTczNVxcdTE3MzZcXHUxN0Q0LVxcdTE3RDZcXHUxN0Q4LVxcdTE3REFcXHUxODAwLVxcdTE4MEFcXHUxOTQ0XFx1MTk0NVxcdTFBMUVcXHUxQTFGXFx1MUFBMC1cXHUxQUE2XFx1MUFBOC1cXHUxQUFEXFx1MUI1QS1cXHUxQjYwXFx1MUJGQy1cXHUxQkZGXFx1MUMzQi1cXHUxQzNGXFx1MUM3RVxcdTFDN0ZcXHUxQ0MwLVxcdTFDQzdcXHUxQ0QzXFx1MjAxMC1cXHUyMDI3XFx1MjAzMC1cXHUyMDQzXFx1MjA0NS1cXHUyMDUxXFx1MjA1My1cXHUyMDVFXFx1MjA3RFxcdTIwN0VcXHUyMDhEXFx1MjA4RVxcdTIzMDgtXFx1MjMwQlxcdTIzMjlcXHUyMzJBXFx1Mjc2OC1cXHUyNzc1XFx1MjdDNVxcdTI3QzZcXHUyN0U2LVxcdTI3RUZcXHUyOTgzLVxcdTI5OThcXHUyOUQ4LVxcdTI5REJcXHUyOUZDXFx1MjlGRFxcdTJDRjktXFx1MkNGQ1xcdTJDRkVcXHUyQ0ZGXFx1MkQ3MFxcdTJFMDAtXFx1MkUyRVxcdTJFMzAtXFx1MkU0RlxcdTJFNTJcXHUzMDAxLVxcdTMwMDNcXHUzMDA4LVxcdTMwMTFcXHUzMDE0LVxcdTMwMUZcXHUzMDMwXFx1MzAzRFxcdTMwQTBcXHUzMEZCXFx1QTRGRVxcdUE0RkZcXHVBNjBELVxcdUE2MEZcXHVBNjczXFx1QTY3RVxcdUE2RjItXFx1QTZGN1xcdUE4NzQtXFx1QTg3N1xcdUE4Q0VcXHVBOENGXFx1QThGOC1cXHVBOEZBXFx1QThGQ1xcdUE5MkVcXHVBOTJGXFx1QTk1RlxcdUE5QzEtXFx1QTlDRFxcdUE5REVcXHVBOURGXFx1QUE1Qy1cXHVBQTVGXFx1QUFERVxcdUFBREZcXHVBQUYwXFx1QUFGMVxcdUFCRUJcXHVGRDNFXFx1RkQzRlxcdUZFMTAtXFx1RkUxOVxcdUZFMzAtXFx1RkU1MlxcdUZFNTQtXFx1RkU2MVxcdUZFNjNcXHVGRTY4XFx1RkU2QVxcdUZFNkJcXHVGRjAxLVxcdUZGMDNcXHVGRjA1LVxcdUZGMEFcXHVGRjBDLVxcdUZGMEZcXHVGRjFBXFx1RkYxQlxcdUZGMUZcXHVGRjIwXFx1RkYzQi1cXHVGRjNEXFx1RkYzRlxcdUZGNUJcXHVGRjVEXFx1RkY1Ri1cXHVGRjY1XS9cblxubW9kdWxlLmV4cG9ydHMgPSB1bmljb2RlUHVuY3R1YXRpb25cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgcmVnZXhDaGVjayA9IHJlcXVpcmUoJy4uL3V0aWwvcmVnZXgtY2hlY2suanMnKVxuXG52YXIgdW5pY29kZVdoaXRlc3BhY2UgPSByZWdleENoZWNrKC9cXHMvKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVuaWNvZGVXaGl0ZXNwYWNlXG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmctb3Itc3BhY2UuanMnKVxudmFyIHVuaWNvZGVQdW5jdHVhdGlvbiA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci91bmljb2RlLXB1bmN0dWF0aW9uLmpzJylcbnZhciB1bmljb2RlV2hpdGVzcGFjZSA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci91bmljb2RlLXdoaXRlc3BhY2UuanMnKVxuXG4vLyBDbGFzc2lmeSB3aGV0aGVyIGEgY2hhcmFjdGVyIGlzIHVuaWNvZGUgd2hpdGVzcGFjZSwgdW5pY29kZSBwdW5jdHVhdGlvbiwgb3Jcbi8vIGFueXRoaW5nIGVsc2UuXG4vLyBVc2VkIGZvciBhdHRlbnRpb24gKGVtcGhhc2lzLCBzdHJvbmcpLCB3aG9zZSBzZXF1ZW5jZXMgY2FuIG9wZW4gb3IgY2xvc2Vcbi8vIGJhc2VkIG9uIHRoZSBjbGFzcyBvZiBzdXJyb3VuZGluZyBjaGFyYWN0ZXJzLlxuZnVuY3Rpb24gY2xhc3NpZnlDaGFyYWN0ZXIoY29kZSkge1xuICBpZiAoXG4gICAgY29kZSA9PT0gbnVsbCB8fFxuICAgIG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UoY29kZSkgfHxcbiAgICB1bmljb2RlV2hpdGVzcGFjZShjb2RlKVxuICApIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgaWYgKHVuaWNvZGVQdW5jdHVhdGlvbihjb2RlKSkge1xuICAgIHJldHVybiAyXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc2lmeUNoYXJhY3RlclxuIiwiJ3VzZSBzdHJpY3QnXG5cbi8vIGNodW5rcyAocmVwbGFjZW1lbnQgY2hhcmFjdGVycywgdGFicywgb3IgbGluZSBlbmRpbmdzKS5cblxuZnVuY3Rpb24gbW92ZVBvaW50KHBvaW50LCBvZmZzZXQpIHtcbiAgcG9pbnQuY29sdW1uICs9IG9mZnNldFxuICBwb2ludC5vZmZzZXQgKz0gb2Zmc2V0XG4gIHBvaW50Ll9idWZmZXJJbmRleCArPSBvZmZzZXRcbiAgcmV0dXJuIHBvaW50XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbW92ZVBvaW50XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGNodW5rZWRQdXNoID0gcmVxdWlyZSgnLi4vdXRpbC9jaHVua2VkLXB1c2guanMnKVxudmFyIGNodW5rZWRTcGxpY2UgPSByZXF1aXJlKCcuLi91dGlsL2NodW5rZWQtc3BsaWNlLmpzJylcbnZhciBjbGFzc2lmeUNoYXJhY3RlciA9IHJlcXVpcmUoJy4uL3V0aWwvY2xhc3NpZnktY2hhcmFjdGVyLmpzJylcbnZhciBtb3ZlUG9pbnQgPSByZXF1aXJlKCcuLi91dGlsL21vdmUtcG9pbnQuanMnKVxudmFyIHJlc29sdmVBbGwgPSByZXF1aXJlKCcuLi91dGlsL3Jlc29sdmUtYWxsLmpzJylcbnZhciBzaGFsbG93ID0gcmVxdWlyZSgnLi4vdXRpbC9zaGFsbG93LmpzJylcblxudmFyIGF0dGVudGlvbiA9IHtcbiAgbmFtZTogJ2F0dGVudGlvbicsXG4gIHRva2VuaXplOiB0b2tlbml6ZUF0dGVudGlvbixcbiAgcmVzb2x2ZUFsbDogcmVzb2x2ZUFsbEF0dGVudGlvblxufVxuXG5mdW5jdGlvbiByZXNvbHZlQWxsQXR0ZW50aW9uKGV2ZW50cywgY29udGV4dCkge1xuICB2YXIgaW5kZXggPSAtMVxuICB2YXIgb3BlblxuICB2YXIgZ3JvdXBcbiAgdmFyIHRleHRcbiAgdmFyIG9wZW5pbmdTZXF1ZW5jZVxuICB2YXIgY2xvc2luZ1NlcXVlbmNlXG4gIHZhciB1c2VcbiAgdmFyIG5leHRFdmVudHNcbiAgdmFyIG9mZnNldCAvLyBXYWxrIHRocm91Z2ggYWxsIGV2ZW50cy5cbiAgLy9cbiAgLy8gTm90ZTogcGVyZm9ybWFuY2Ugb2YgdGhpcyBpcyBmaW5lIG9uIGFuIG1iIG9mIG5vcm1hbCBtYXJrZG93biwgYnV0IGl04oCZc1xuICAvLyBhIGJvdHRsZW5lY2sgZm9yIG1hbGljaW91cyBzdHVmZi5cblxuICB3aGlsZSAoKytpbmRleCA8IGV2ZW50cy5sZW5ndGgpIHtcbiAgICAvLyBGaW5kIGEgdG9rZW4gdGhhdCBjYW4gY2xvc2UuXG4gICAgaWYgKFxuICAgICAgZXZlbnRzW2luZGV4XVswXSA9PT0gJ2VudGVyJyAmJlxuICAgICAgZXZlbnRzW2luZGV4XVsxXS50eXBlID09PSAnYXR0ZW50aW9uU2VxdWVuY2UnICYmXG4gICAgICBldmVudHNbaW5kZXhdWzFdLl9jbG9zZVxuICAgICkge1xuICAgICAgb3BlbiA9IGluZGV4IC8vIE5vdyB3YWxrIGJhY2sgdG8gZmluZCBhbiBvcGVuZXIuXG5cbiAgICAgIHdoaWxlIChvcGVuLS0pIHtcbiAgICAgICAgLy8gRmluZCBhIHRva2VuIHRoYXQgY2FuIG9wZW4gdGhlIGNsb3Nlci5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGV2ZW50c1tvcGVuXVswXSA9PT0gJ2V4aXQnICYmXG4gICAgICAgICAgZXZlbnRzW29wZW5dWzFdLnR5cGUgPT09ICdhdHRlbnRpb25TZXF1ZW5jZScgJiZcbiAgICAgICAgICBldmVudHNbb3Blbl1bMV0uX29wZW4gJiYgLy8gSWYgdGhlIG1hcmtlcnMgYXJlIHRoZSBzYW1lOlxuICAgICAgICAgIGNvbnRleHQuc2xpY2VTZXJpYWxpemUoZXZlbnRzW29wZW5dWzFdKS5jaGFyQ29kZUF0KDApID09PVxuICAgICAgICAgICAgY29udGV4dC5zbGljZVNlcmlhbGl6ZShldmVudHNbaW5kZXhdWzFdKS5jaGFyQ29kZUF0KDApXG4gICAgICAgICkge1xuICAgICAgICAgIC8vIElmIHRoZSBvcGVuaW5nIGNhbiBjbG9zZSBvciB0aGUgY2xvc2luZyBjYW4gb3BlbixcbiAgICAgICAgICAvLyBhbmQgdGhlIGNsb3NlIHNpemUgKmlzIG5vdCogYSBtdWx0aXBsZSBvZiB0aHJlZSxcbiAgICAgICAgICAvLyBidXQgdGhlIHN1bSBvZiB0aGUgb3BlbmluZyBhbmQgY2xvc2luZyBzaXplICppcyogbXVsdGlwbGUgb2YgdGhyZWUsXG4gICAgICAgICAgLy8gdGhlbiBkb27igJl0IG1hdGNoLlxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIChldmVudHNbb3Blbl1bMV0uX2Nsb3NlIHx8IGV2ZW50c1tpbmRleF1bMV0uX29wZW4pICYmXG4gICAgICAgICAgICAoZXZlbnRzW2luZGV4XVsxXS5lbmQub2Zmc2V0IC0gZXZlbnRzW2luZGV4XVsxXS5zdGFydC5vZmZzZXQpICUgMyAmJlxuICAgICAgICAgICAgIShcbiAgICAgICAgICAgICAgKGV2ZW50c1tvcGVuXVsxXS5lbmQub2Zmc2V0IC1cbiAgICAgICAgICAgICAgICBldmVudHNbb3Blbl1bMV0uc3RhcnQub2Zmc2V0ICtcbiAgICAgICAgICAgICAgICBldmVudHNbaW5kZXhdWzFdLmVuZC5vZmZzZXQgLVxuICAgICAgICAgICAgICAgIGV2ZW50c1tpbmRleF1bMV0uc3RhcnQub2Zmc2V0KSAlXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgIClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfSAvLyBOdW1iZXIgb2YgbWFya2VycyB0byB1c2UgZnJvbSB0aGUgc2VxdWVuY2UuXG5cbiAgICAgICAgICB1c2UgPVxuICAgICAgICAgICAgZXZlbnRzW29wZW5dWzFdLmVuZC5vZmZzZXQgLSBldmVudHNbb3Blbl1bMV0uc3RhcnQub2Zmc2V0ID4gMSAmJlxuICAgICAgICAgICAgZXZlbnRzW2luZGV4XVsxXS5lbmQub2Zmc2V0IC0gZXZlbnRzW2luZGV4XVsxXS5zdGFydC5vZmZzZXQgPiAxXG4gICAgICAgICAgICAgID8gMlxuICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICBvcGVuaW5nU2VxdWVuY2UgPSB7XG4gICAgICAgICAgICB0eXBlOiB1c2UgPiAxID8gJ3N0cm9uZ1NlcXVlbmNlJyA6ICdlbXBoYXNpc1NlcXVlbmNlJyxcbiAgICAgICAgICAgIHN0YXJ0OiBtb3ZlUG9pbnQoc2hhbGxvdyhldmVudHNbb3Blbl1bMV0uZW5kKSwgLXVzZSksXG4gICAgICAgICAgICBlbmQ6IHNoYWxsb3coZXZlbnRzW29wZW5dWzFdLmVuZClcbiAgICAgICAgICB9XG4gICAgICAgICAgY2xvc2luZ1NlcXVlbmNlID0ge1xuICAgICAgICAgICAgdHlwZTogdXNlID4gMSA/ICdzdHJvbmdTZXF1ZW5jZScgOiAnZW1waGFzaXNTZXF1ZW5jZScsXG4gICAgICAgICAgICBzdGFydDogc2hhbGxvdyhldmVudHNbaW5kZXhdWzFdLnN0YXJ0KSxcbiAgICAgICAgICAgIGVuZDogbW92ZVBvaW50KHNoYWxsb3coZXZlbnRzW2luZGV4XVsxXS5zdGFydCksIHVzZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgdGV4dCA9IHtcbiAgICAgICAgICAgIHR5cGU6IHVzZSA+IDEgPyAnc3Ryb25nVGV4dCcgOiAnZW1waGFzaXNUZXh0JyxcbiAgICAgICAgICAgIHN0YXJ0OiBzaGFsbG93KGV2ZW50c1tvcGVuXVsxXS5lbmQpLFxuICAgICAgICAgICAgZW5kOiBzaGFsbG93KGV2ZW50c1tpbmRleF1bMV0uc3RhcnQpXG4gICAgICAgICAgfVxuICAgICAgICAgIGdyb3VwID0ge1xuICAgICAgICAgICAgdHlwZTogdXNlID4gMSA/ICdzdHJvbmcnIDogJ2VtcGhhc2lzJyxcbiAgICAgICAgICAgIHN0YXJ0OiBzaGFsbG93KG9wZW5pbmdTZXF1ZW5jZS5zdGFydCksXG4gICAgICAgICAgICBlbmQ6IHNoYWxsb3coY2xvc2luZ1NlcXVlbmNlLmVuZClcbiAgICAgICAgICB9XG4gICAgICAgICAgZXZlbnRzW29wZW5dWzFdLmVuZCA9IHNoYWxsb3cob3BlbmluZ1NlcXVlbmNlLnN0YXJ0KVxuICAgICAgICAgIGV2ZW50c1tpbmRleF1bMV0uc3RhcnQgPSBzaGFsbG93KGNsb3NpbmdTZXF1ZW5jZS5lbmQpXG4gICAgICAgICAgbmV4dEV2ZW50cyA9IFtdIC8vIElmIHRoZXJlIGFyZSBtb3JlIG1hcmtlcnMgaW4gdGhlIG9wZW5pbmcsIGFkZCB0aGVtIGJlZm9yZS5cblxuICAgICAgICAgIGlmIChldmVudHNbb3Blbl1bMV0uZW5kLm9mZnNldCAtIGV2ZW50c1tvcGVuXVsxXS5zdGFydC5vZmZzZXQpIHtcbiAgICAgICAgICAgIG5leHRFdmVudHMgPSBjaHVua2VkUHVzaChuZXh0RXZlbnRzLCBbXG4gICAgICAgICAgICAgIFsnZW50ZXInLCBldmVudHNbb3Blbl1bMV0sIGNvbnRleHRdLFxuICAgICAgICAgICAgICBbJ2V4aXQnLCBldmVudHNbb3Blbl1bMV0sIGNvbnRleHRdXG4gICAgICAgICAgICBdKVxuICAgICAgICAgIH0gLy8gT3BlbmluZy5cblxuICAgICAgICAgIG5leHRFdmVudHMgPSBjaHVua2VkUHVzaChuZXh0RXZlbnRzLCBbXG4gICAgICAgICAgICBbJ2VudGVyJywgZ3JvdXAsIGNvbnRleHRdLFxuICAgICAgICAgICAgWydlbnRlcicsIG9wZW5pbmdTZXF1ZW5jZSwgY29udGV4dF0sXG4gICAgICAgICAgICBbJ2V4aXQnLCBvcGVuaW5nU2VxdWVuY2UsIGNvbnRleHRdLFxuICAgICAgICAgICAgWydlbnRlcicsIHRleHQsIGNvbnRleHRdXG4gICAgICAgICAgXSkgLy8gQmV0d2Vlbi5cblxuICAgICAgICAgIG5leHRFdmVudHMgPSBjaHVua2VkUHVzaChcbiAgICAgICAgICAgIG5leHRFdmVudHMsXG4gICAgICAgICAgICByZXNvbHZlQWxsKFxuICAgICAgICAgICAgICBjb250ZXh0LnBhcnNlci5jb25zdHJ1Y3RzLmluc2lkZVNwYW4ubnVsbCxcbiAgICAgICAgICAgICAgZXZlbnRzLnNsaWNlKG9wZW4gKyAxLCBpbmRleCksXG4gICAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAgIClcbiAgICAgICAgICApIC8vIENsb3NpbmcuXG5cbiAgICAgICAgICBuZXh0RXZlbnRzID0gY2h1bmtlZFB1c2gobmV4dEV2ZW50cywgW1xuICAgICAgICAgICAgWydleGl0JywgdGV4dCwgY29udGV4dF0sXG4gICAgICAgICAgICBbJ2VudGVyJywgY2xvc2luZ1NlcXVlbmNlLCBjb250ZXh0XSxcbiAgICAgICAgICAgIFsnZXhpdCcsIGNsb3NpbmdTZXF1ZW5jZSwgY29udGV4dF0sXG4gICAgICAgICAgICBbJ2V4aXQnLCBncm91cCwgY29udGV4dF1cbiAgICAgICAgICBdKSAvLyBJZiB0aGVyZSBhcmUgbW9yZSBtYXJrZXJzIGluIHRoZSBjbG9zaW5nLCBhZGQgdGhlbSBhZnRlci5cblxuICAgICAgICAgIGlmIChldmVudHNbaW5kZXhdWzFdLmVuZC5vZmZzZXQgLSBldmVudHNbaW5kZXhdWzFdLnN0YXJ0Lm9mZnNldCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gMlxuICAgICAgICAgICAgbmV4dEV2ZW50cyA9IGNodW5rZWRQdXNoKG5leHRFdmVudHMsIFtcbiAgICAgICAgICAgICAgWydlbnRlcicsIGV2ZW50c1tpbmRleF1bMV0sIGNvbnRleHRdLFxuICAgICAgICAgICAgICBbJ2V4aXQnLCBldmVudHNbaW5kZXhdWzFdLCBjb250ZXh0XVxuICAgICAgICAgICAgXSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2Zmc2V0ID0gMFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNodW5rZWRTcGxpY2UoZXZlbnRzLCBvcGVuIC0gMSwgaW5kZXggLSBvcGVuICsgMywgbmV4dEV2ZW50cylcbiAgICAgICAgICBpbmRleCA9IG9wZW4gKyBuZXh0RXZlbnRzLmxlbmd0aCAtIG9mZnNldCAtIDJcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IC8vIFJlbW92ZSByZW1haW5pbmcgc2VxdWVuY2VzLlxuXG4gIGluZGV4ID0gLTFcblxuICB3aGlsZSAoKytpbmRleCA8IGV2ZW50cy5sZW5ndGgpIHtcbiAgICBpZiAoZXZlbnRzW2luZGV4XVsxXS50eXBlID09PSAnYXR0ZW50aW9uU2VxdWVuY2UnKSB7XG4gICAgICBldmVudHNbaW5kZXhdWzFdLnR5cGUgPSAnZGF0YSdcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZXZlbnRzXG59XG5cbmZ1bmN0aW9uIHRva2VuaXplQXR0ZW50aW9uKGVmZmVjdHMsIG9rKSB7XG4gIHZhciBiZWZvcmUgPSBjbGFzc2lmeUNoYXJhY3Rlcih0aGlzLnByZXZpb3VzKVxuICB2YXIgbWFya2VyXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdhdHRlbnRpb25TZXF1ZW5jZScpXG4gICAgbWFya2VyID0gY29kZVxuICAgIHJldHVybiBzZXF1ZW5jZShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gc2VxdWVuY2UoY29kZSkge1xuICAgIHZhciB0b2tlblxuICAgIHZhciBhZnRlclxuICAgIHZhciBvcGVuXG4gICAgdmFyIGNsb3NlXG5cbiAgICBpZiAoY29kZSA9PT0gbWFya2VyKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBzZXF1ZW5jZVxuICAgIH1cblxuICAgIHRva2VuID0gZWZmZWN0cy5leGl0KCdhdHRlbnRpb25TZXF1ZW5jZScpXG4gICAgYWZ0ZXIgPSBjbGFzc2lmeUNoYXJhY3Rlcihjb2RlKVxuICAgIG9wZW4gPSAhYWZ0ZXIgfHwgKGFmdGVyID09PSAyICYmIGJlZm9yZSlcbiAgICBjbG9zZSA9ICFiZWZvcmUgfHwgKGJlZm9yZSA9PT0gMiAmJiBhZnRlcilcbiAgICB0b2tlbi5fb3BlbiA9IG1hcmtlciA9PT0gNDIgPyBvcGVuIDogb3BlbiAmJiAoYmVmb3JlIHx8ICFjbG9zZSlcbiAgICB0b2tlbi5fY2xvc2UgPSBtYXJrZXIgPT09IDQyID8gY2xvc2UgOiBjbG9zZSAmJiAoYWZ0ZXIgfHwgIW9wZW4pXG4gICAgcmV0dXJuIG9rKGNvZGUpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhdHRlbnRpb25cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgcmVnZXhDaGVjayA9IHJlcXVpcmUoJy4uL3V0aWwvcmVnZXgtY2hlY2suanMnKVxuXG52YXIgYXNjaWlBbHBoYSA9IHJlZ2V4Q2hlY2soL1tBLVphLXpdLylcblxubW9kdWxlLmV4cG9ydHMgPSBhc2NpaUFscGhhXG4iLCIndXNlIHN0cmljdCdcblxudmFyIHJlZ2V4Q2hlY2sgPSByZXF1aXJlKCcuLi91dGlsL3JlZ2V4LWNoZWNrLmpzJylcblxudmFyIGFzY2lpQWxwaGFudW1lcmljID0gcmVnZXhDaGVjaygvW1xcZEEtWmEtel0vKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzY2lpQWxwaGFudW1lcmljXG4iLCIndXNlIHN0cmljdCdcblxudmFyIHJlZ2V4Q2hlY2sgPSByZXF1aXJlKCcuLi91dGlsL3JlZ2V4LWNoZWNrLmpzJylcblxudmFyIGFzY2lpQXRleHQgPSByZWdleENoZWNrKC9bIy0nKitcXC0tOT0/QS1aXi1+XS8pXG5cbm1vZHVsZS5leHBvcnRzID0gYXNjaWlBdGV4dFxuIiwiJ3VzZSBzdHJpY3QnXG5cbi8vIE5vdGU6IEVPRiBpcyBzZWVuIGFzIEFTQ0lJIGNvbnRyb2wgaGVyZSwgYmVjYXVzZSBgbnVsbCA8IDMyID09IHRydWVgLlxuZnVuY3Rpb24gYXNjaWlDb250cm9sKGNvZGUpIHtcbiAgcmV0dXJuIChcbiAgICAvLyBTcGVjaWFsIHdoaXRlc3BhY2UgY29kZXMgKHdoaWNoIGhhdmUgbmVnYXRpdmUgdmFsdWVzKSwgQzAgYW5kIENvbnRyb2xcbiAgICAvLyBjaGFyYWN0ZXIgREVMXG4gICAgY29kZSA8IDMyIHx8IGNvZGUgPT09IDEyN1xuICApXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXNjaWlDb250cm9sXG4iLCIndXNlIHN0cmljdCdcblxudmFyIGFzY2lpQWxwaGEgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvYXNjaWktYWxwaGEuanMnKVxudmFyIGFzY2lpQWxwaGFudW1lcmljID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL2FzY2lpLWFscGhhbnVtZXJpYy5qcycpXG52YXIgYXNjaWlBdGV4dCA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9hc2NpaS1hdGV4dC5qcycpXG52YXIgYXNjaWlDb250cm9sID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL2FzY2lpLWNvbnRyb2wuanMnKVxuXG52YXIgYXV0b2xpbmsgPSB7XG4gIG5hbWU6ICdhdXRvbGluaycsXG4gIHRva2VuaXplOiB0b2tlbml6ZUF1dG9saW5rXG59XG5cbmZ1bmN0aW9uIHRva2VuaXplQXV0b2xpbmsoZWZmZWN0cywgb2ssIG5vaykge1xuICB2YXIgc2l6ZSA9IDFcbiAgcmV0dXJuIHN0YXJ0XG5cbiAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgIGVmZmVjdHMuZW50ZXIoJ2F1dG9saW5rJylcbiAgICBlZmZlY3RzLmVudGVyKCdhdXRvbGlua01hcmtlcicpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgZWZmZWN0cy5leGl0KCdhdXRvbGlua01hcmtlcicpXG4gICAgZWZmZWN0cy5lbnRlcignYXV0b2xpbmtQcm90b2NvbCcpXG4gICAgcmV0dXJuIG9wZW5cbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW4oY29kZSkge1xuICAgIGlmIChhc2NpaUFscGhhKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBzY2hlbWVPckVtYWlsQXRleHRcbiAgICB9XG5cbiAgICByZXR1cm4gYXNjaWlBdGV4dChjb2RlKSA/IGVtYWlsQXRleHQoY29kZSkgOiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjaGVtZU9yRW1haWxBdGV4dChjb2RlKSB7XG4gICAgcmV0dXJuIGNvZGUgPT09IDQzIHx8IGNvZGUgPT09IDQ1IHx8IGNvZGUgPT09IDQ2IHx8IGFzY2lpQWxwaGFudW1lcmljKGNvZGUpXG4gICAgICA/IHNjaGVtZUluc2lkZU9yRW1haWxBdGV4dChjb2RlKVxuICAgICAgOiBlbWFpbEF0ZXh0KGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBzY2hlbWVJbnNpZGVPckVtYWlsQXRleHQoY29kZSkge1xuICAgIGlmIChjb2RlID09PSA1OCkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gdXJsSW5zaWRlXG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgKGNvZGUgPT09IDQzIHx8IGNvZGUgPT09IDQ1IHx8IGNvZGUgPT09IDQ2IHx8IGFzY2lpQWxwaGFudW1lcmljKGNvZGUpKSAmJlxuICAgICAgc2l6ZSsrIDwgMzJcbiAgICApIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIHNjaGVtZUluc2lkZU9yRW1haWxBdGV4dFxuICAgIH1cblxuICAgIHJldHVybiBlbWFpbEF0ZXh0KGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiB1cmxJbnNpZGUoY29kZSkge1xuICAgIGlmIChjb2RlID09PSA2Mikge1xuICAgICAgZWZmZWN0cy5leGl0KCdhdXRvbGlua1Byb3RvY29sJylcbiAgICAgIHJldHVybiBlbmQoY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gMzIgfHwgY29kZSA9PT0gNjAgfHwgYXNjaWlDb250cm9sKGNvZGUpKSB7XG4gICAgICByZXR1cm4gbm9rKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIHVybEluc2lkZVxuICB9XG5cbiAgZnVuY3Rpb24gZW1haWxBdGV4dChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDY0KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHNpemUgPSAwXG4gICAgICByZXR1cm4gZW1haWxBdFNpZ25PckRvdFxuICAgIH1cblxuICAgIGlmIChhc2NpaUF0ZXh0KGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBlbWFpbEF0ZXh0XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZW1haWxBdFNpZ25PckRvdChjb2RlKSB7XG4gICAgcmV0dXJuIGFzY2lpQWxwaGFudW1lcmljKGNvZGUpID8gZW1haWxMYWJlbChjb2RlKSA6IG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZW1haWxMYWJlbChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDQ2KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHNpemUgPSAwXG4gICAgICByZXR1cm4gZW1haWxBdFNpZ25PckRvdFxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA2Mikge1xuICAgICAgLy8gRXhpdCwgdGhlbiBjaGFuZ2UgdGhlIHR5cGUuXG4gICAgICBlZmZlY3RzLmV4aXQoJ2F1dG9saW5rUHJvdG9jb2wnKS50eXBlID0gJ2F1dG9saW5rRW1haWwnXG4gICAgICByZXR1cm4gZW5kKGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIGVtYWlsVmFsdWUoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGVtYWlsVmFsdWUoY29kZSkge1xuICAgIGlmICgoY29kZSA9PT0gNDUgfHwgYXNjaWlBbHBoYW51bWVyaWMoY29kZSkpICYmIHNpemUrKyA8IDYzKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb2RlID09PSA0NSA/IGVtYWlsVmFsdWUgOiBlbWFpbExhYmVsXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZW5kKGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdhdXRvbGlua01hcmtlcicpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgZWZmZWN0cy5leGl0KCdhdXRvbGlua01hcmtlcicpXG4gICAgZWZmZWN0cy5leGl0KCdhdXRvbGluaycpXG4gICAgcmV0dXJuIG9rXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhdXRvbGlua1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBtYXJrZG93blNwYWNlID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLXNwYWNlLmpzJylcbnZhciBmYWN0b3J5U3BhY2UgPSByZXF1aXJlKCcuL2ZhY3Rvcnktc3BhY2UuanMnKVxuXG52YXIgYmxvY2tRdW90ZSA9IHtcbiAgbmFtZTogJ2Jsb2NrUXVvdGUnLFxuICB0b2tlbml6ZTogdG9rZW5pemVCbG9ja1F1b3RlU3RhcnQsXG4gIGNvbnRpbnVhdGlvbjoge1xuICAgIHRva2VuaXplOiB0b2tlbml6ZUJsb2NrUXVvdGVDb250aW51YXRpb25cbiAgfSxcbiAgZXhpdDogZXhpdFxufVxuXG5mdW5jdGlvbiB0b2tlbml6ZUJsb2NrUXVvdGVTdGFydChlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDYyKSB7XG4gICAgICBpZiAoIXNlbGYuY29udGFpbmVyU3RhdGUub3Blbikge1xuICAgICAgICBlZmZlY3RzLmVudGVyKCdibG9ja1F1b3RlJywge1xuICAgICAgICAgIF9jb250YWluZXI6IHRydWVcbiAgICAgICAgfSlcbiAgICAgICAgc2VsZi5jb250YWluZXJTdGF0ZS5vcGVuID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBlZmZlY3RzLmVudGVyKCdibG9ja1F1b3RlUHJlZml4JylcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ2Jsb2NrUXVvdGVNYXJrZXInKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2Jsb2NrUXVvdGVNYXJrZXInKVxuICAgICAgcmV0dXJuIGFmdGVyXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gYWZ0ZXIoY29kZSkge1xuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdibG9ja1F1b3RlUHJlZml4V2hpdGVzcGFjZScpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdCgnYmxvY2tRdW90ZVByZWZpeFdoaXRlc3BhY2UnKVxuICAgICAgZWZmZWN0cy5leGl0KCdibG9ja1F1b3RlUHJlZml4JylcbiAgICAgIHJldHVybiBva1xuICAgIH1cblxuICAgIGVmZmVjdHMuZXhpdCgnYmxvY2tRdW90ZVByZWZpeCcpXG4gICAgcmV0dXJuIG9rKGNvZGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gdG9rZW5pemVCbG9ja1F1b3RlQ29udGludWF0aW9uKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgcmV0dXJuIGZhY3RvcnlTcGFjZShcbiAgICBlZmZlY3RzLFxuICAgIGVmZmVjdHMuYXR0ZW1wdChibG9ja1F1b3RlLCBvaywgbm9rKSxcbiAgICAnbGluZVByZWZpeCcsXG4gICAgdGhpcy5wYXJzZXIuY29uc3RydWN0cy5kaXNhYmxlLm51bGwuaW5kZXhPZignY29kZUluZGVudGVkJykgPiAtMVxuICAgICAgPyB1bmRlZmluZWRcbiAgICAgIDogNFxuICApXG59XG5cbmZ1bmN0aW9uIGV4aXQoZWZmZWN0cykge1xuICBlZmZlY3RzLmV4aXQoJ2Jsb2NrUXVvdGUnKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJsb2NrUXVvdGVcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgcmVnZXhDaGVjayA9IHJlcXVpcmUoJy4uL3V0aWwvcmVnZXgtY2hlY2suanMnKVxuXG52YXIgYXNjaWlQdW5jdHVhdGlvbiA9IHJlZ2V4Q2hlY2soL1shLS86LUBbLWB7LX5dLylcblxubW9kdWxlLmV4cG9ydHMgPSBhc2NpaVB1bmN0dWF0aW9uXG4iLCIndXNlIHN0cmljdCdcblxudmFyIGFzY2lpUHVuY3R1YXRpb24gPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvYXNjaWktcHVuY3R1YXRpb24uanMnKVxuXG52YXIgY2hhcmFjdGVyRXNjYXBlID0ge1xuICBuYW1lOiAnY2hhcmFjdGVyRXNjYXBlJyxcbiAgdG9rZW5pemU6IHRva2VuaXplQ2hhcmFjdGVyRXNjYXBlXG59XG5cbmZ1bmN0aW9uIHRva2VuaXplQ2hhcmFjdGVyRXNjYXBlKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgcmV0dXJuIHN0YXJ0XG5cbiAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgIGVmZmVjdHMuZW50ZXIoJ2NoYXJhY3RlckVzY2FwZScpXG4gICAgZWZmZWN0cy5lbnRlcignZXNjYXBlTWFya2VyJylcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQoJ2VzY2FwZU1hcmtlcicpXG4gICAgcmV0dXJuIG9wZW5cbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW4oY29kZSkge1xuICAgIGlmIChhc2NpaVB1bmN0dWF0aW9uKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdjaGFyYWN0ZXJFc2NhcGVWYWx1ZScpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdCgnY2hhcmFjdGVyRXNjYXBlVmFsdWUnKVxuICAgICAgZWZmZWN0cy5leGl0KCdjaGFyYWN0ZXJFc2NhcGUnKVxuICAgICAgcmV0dXJuIG9rXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2hhcmFjdGVyRXNjYXBlXG4iLCIndXNlIHN0cmljdCdcblxudmFyIGNoYXJhY3RlckVudGl0aWVzID0gcmVxdWlyZSgnY2hhcmFjdGVyLWVudGl0aWVzJylcblxubW9kdWxlLmV4cG9ydHMgPSBkZWNvZGVFbnRpdHlcblxudmFyIG93biA9IHt9Lmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIGRlY29kZUVudGl0eShjaGFyYWN0ZXJzKSB7XG4gIHJldHVybiBvd24uY2FsbChjaGFyYWN0ZXJFbnRpdGllcywgY2hhcmFjdGVycylcbiAgICA/IGNoYXJhY3RlckVudGl0aWVzW2NoYXJhY3RlcnNdXG4gICAgOiBmYWxzZVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciByZWdleENoZWNrID0gcmVxdWlyZSgnLi4vdXRpbC9yZWdleC1jaGVjay5qcycpXG5cbnZhciBhc2NpaURpZ2l0ID0gcmVnZXhDaGVjaygvXFxkLylcblxubW9kdWxlLmV4cG9ydHMgPSBhc2NpaURpZ2l0XG4iLCIndXNlIHN0cmljdCdcblxudmFyIHJlZ2V4Q2hlY2sgPSByZXF1aXJlKCcuLi91dGlsL3JlZ2V4LWNoZWNrLmpzJylcblxudmFyIGFzY2lpSGV4RGlnaXQgPSByZWdleENoZWNrKC9bXFxkQS1GYS1mXS8pXG5cbm1vZHVsZS5leHBvcnRzID0gYXNjaWlIZXhEaWdpdFxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBkZWNvZGVFbnRpdHkgPSByZXF1aXJlKCdwYXJzZS1lbnRpdGllcy9kZWNvZGUtZW50aXR5LmpzJylcbnZhciBhc2NpaUFscGhhbnVtZXJpYyA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9hc2NpaS1hbHBoYW51bWVyaWMuanMnKVxudmFyIGFzY2lpRGlnaXQgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvYXNjaWktZGlnaXQuanMnKVxudmFyIGFzY2lpSGV4RGlnaXQgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvYXNjaWktaGV4LWRpZ2l0LmpzJylcblxuZnVuY3Rpb24gX2ludGVyb3BEZWZhdWx0TGVnYWN5KGUpIHtcbiAgcmV0dXJuIGUgJiYgdHlwZW9mIGUgPT09ICdvYmplY3QnICYmICdkZWZhdWx0JyBpbiBlID8gZSA6IHtkZWZhdWx0OiBlfVxufVxuXG52YXIgZGVjb2RlRW50aXR5X19kZWZhdWx0ID0gLyojX19QVVJFX18qLyBfaW50ZXJvcERlZmF1bHRMZWdhY3koZGVjb2RlRW50aXR5KVxuXG52YXIgY2hhcmFjdGVyUmVmZXJlbmNlID0ge1xuICBuYW1lOiAnY2hhcmFjdGVyUmVmZXJlbmNlJyxcbiAgdG9rZW5pemU6IHRva2VuaXplQ2hhcmFjdGVyUmVmZXJlbmNlXG59XG5cbmZ1bmN0aW9uIHRva2VuaXplQ2hhcmFjdGVyUmVmZXJlbmNlKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHZhciBzaXplID0gMFxuICB2YXIgbWF4XG4gIHZhciB0ZXN0XG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdjaGFyYWN0ZXJSZWZlcmVuY2UnKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2NoYXJhY3RlclJlZmVyZW5jZU1hcmtlcicpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgZWZmZWN0cy5leGl0KCdjaGFyYWN0ZXJSZWZlcmVuY2VNYXJrZXInKVxuICAgIHJldHVybiBvcGVuXG4gIH1cblxuICBmdW5jdGlvbiBvcGVuKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gMzUpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ2NoYXJhY3RlclJlZmVyZW5jZU1hcmtlck51bWVyaWMnKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2NoYXJhY3RlclJlZmVyZW5jZU1hcmtlck51bWVyaWMnKVxuICAgICAgcmV0dXJuIG51bWVyaWNcbiAgICB9XG5cbiAgICBlZmZlY3RzLmVudGVyKCdjaGFyYWN0ZXJSZWZlcmVuY2VWYWx1ZScpXG4gICAgbWF4ID0gMzFcbiAgICB0ZXN0ID0gYXNjaWlBbHBoYW51bWVyaWNcbiAgICByZXR1cm4gdmFsdWUoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG51bWVyaWMoY29kZSkge1xuICAgIGlmIChjb2RlID09PSA4OCB8fCBjb2RlID09PSAxMjApIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ2NoYXJhY3RlclJlZmVyZW5jZU1hcmtlckhleGFkZWNpbWFsJylcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KCdjaGFyYWN0ZXJSZWZlcmVuY2VNYXJrZXJIZXhhZGVjaW1hbCcpXG4gICAgICBlZmZlY3RzLmVudGVyKCdjaGFyYWN0ZXJSZWZlcmVuY2VWYWx1ZScpXG4gICAgICBtYXggPSA2XG4gICAgICB0ZXN0ID0gYXNjaWlIZXhEaWdpdFxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuXG4gICAgZWZmZWN0cy5lbnRlcignY2hhcmFjdGVyUmVmZXJlbmNlVmFsdWUnKVxuICAgIG1heCA9IDdcbiAgICB0ZXN0ID0gYXNjaWlEaWdpdFxuICAgIHJldHVybiB2YWx1ZShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gdmFsdWUoY29kZSkge1xuICAgIHZhciB0b2tlblxuXG4gICAgaWYgKGNvZGUgPT09IDU5ICYmIHNpemUpIHtcbiAgICAgIHRva2VuID0gZWZmZWN0cy5leGl0KCdjaGFyYWN0ZXJSZWZlcmVuY2VWYWx1ZScpXG5cbiAgICAgIGlmIChcbiAgICAgICAgdGVzdCA9PT0gYXNjaWlBbHBoYW51bWVyaWMgJiZcbiAgICAgICAgIWRlY29kZUVudGl0eV9fZGVmYXVsdFsnZGVmYXVsdCddKHNlbGYuc2xpY2VTZXJpYWxpemUodG9rZW4pKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBub2soY29kZSlcbiAgICAgIH1cblxuICAgICAgZWZmZWN0cy5lbnRlcignY2hhcmFjdGVyUmVmZXJlbmNlTWFya2VyJylcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KCdjaGFyYWN0ZXJSZWZlcmVuY2VNYXJrZXInKVxuICAgICAgZWZmZWN0cy5leGl0KCdjaGFyYWN0ZXJSZWZlcmVuY2UnKVxuICAgICAgcmV0dXJuIG9rXG4gICAgfVxuXG4gICAgaWYgKHRlc3QoY29kZSkgJiYgc2l6ZSsrIDwgbWF4KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNoYXJhY3RlclJlZmVyZW5jZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBtYXJrZG93bkxpbmVFbmRpbmcgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmcuanMnKVxudmFyIG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmctb3Itc3BhY2UuanMnKVxudmFyIHByZWZpeFNpemUgPSByZXF1aXJlKCcuLi91dGlsL3ByZWZpeC1zaXplLmpzJylcbnZhciBmYWN0b3J5U3BhY2UgPSByZXF1aXJlKCcuL2ZhY3Rvcnktc3BhY2UuanMnKVxuXG52YXIgY29kZUZlbmNlZCA9IHtcbiAgbmFtZTogJ2NvZGVGZW5jZWQnLFxuICB0b2tlbml6ZTogdG9rZW5pemVDb2RlRmVuY2VkLFxuICBjb25jcmV0ZTogdHJ1ZVxufVxuXG5mdW5jdGlvbiB0b2tlbml6ZUNvZGVGZW5jZWQoZWZmZWN0cywgb2ssIG5vaykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgdmFyIGNsb3NpbmdGZW5jZUNvbnN0cnVjdCA9IHtcbiAgICB0b2tlbml6ZTogdG9rZW5pemVDbG9zaW5nRmVuY2UsXG4gICAgcGFydGlhbDogdHJ1ZVxuICB9XG4gIHZhciBpbml0aWFsUHJlZml4ID0gcHJlZml4U2l6ZSh0aGlzLmV2ZW50cywgJ2xpbmVQcmVmaXgnKVxuICB2YXIgc2l6ZU9wZW4gPSAwXG4gIHZhciBtYXJrZXJcbiAgcmV0dXJuIHN0YXJ0XG5cbiAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgIGVmZmVjdHMuZW50ZXIoJ2NvZGVGZW5jZWQnKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2NvZGVGZW5jZWRGZW5jZScpXG4gICAgZWZmZWN0cy5lbnRlcignY29kZUZlbmNlZEZlbmNlU2VxdWVuY2UnKVxuICAgIG1hcmtlciA9IGNvZGVcbiAgICByZXR1cm4gc2VxdWVuY2VPcGVuKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBzZXF1ZW5jZU9wZW4oY29kZSkge1xuICAgIGlmIChjb2RlID09PSBtYXJrZXIpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgc2l6ZU9wZW4rK1xuICAgICAgcmV0dXJuIHNlcXVlbmNlT3BlblxuICAgIH1cblxuICAgIGVmZmVjdHMuZXhpdCgnY29kZUZlbmNlZEZlbmNlU2VxdWVuY2UnKVxuICAgIHJldHVybiBzaXplT3BlbiA8IDNcbiAgICAgID8gbm9rKGNvZGUpXG4gICAgICA6IGZhY3RvcnlTcGFjZShlZmZlY3RzLCBpbmZvT3BlbiwgJ3doaXRlc3BhY2UnKShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gaW5mb09wZW4oY29kZSkge1xuICAgIGlmIChjb2RlID09PSBudWxsIHx8IG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgcmV0dXJuIG9wZW5BZnRlcihjb2RlKVxuICAgIH1cblxuICAgIGVmZmVjdHMuZW50ZXIoJ2NvZGVGZW5jZWRGZW5jZUluZm8nKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2NodW5rU3RyaW5nJywge1xuICAgICAgY29udGVudFR5cGU6ICdzdHJpbmcnXG4gICAgfSlcbiAgICByZXR1cm4gaW5mbyhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gaW5mbyhjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nT3JTcGFjZShjb2RlKSkge1xuICAgICAgZWZmZWN0cy5leGl0KCdjaHVua1N0cmluZycpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2NvZGVGZW5jZWRGZW5jZUluZm8nKVxuICAgICAgcmV0dXJuIGZhY3RvcnlTcGFjZShlZmZlY3RzLCBpbmZvQWZ0ZXIsICd3aGl0ZXNwYWNlJykoY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gOTYgJiYgY29kZSA9PT0gbWFya2VyKSByZXR1cm4gbm9rKGNvZGUpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIGluZm9cbiAgfVxuXG4gIGZ1bmN0aW9uIGluZm9BZnRlcihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICByZXR1cm4gb3BlbkFmdGVyKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5lbnRlcignY29kZUZlbmNlZEZlbmNlTWV0YScpXG4gICAgZWZmZWN0cy5lbnRlcignY2h1bmtTdHJpbmcnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ3N0cmluZydcbiAgICB9KVxuICAgIHJldHVybiBtZXRhKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBtZXRhKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuZXhpdCgnY2h1bmtTdHJpbmcnKVxuICAgICAgZWZmZWN0cy5leGl0KCdjb2RlRmVuY2VkRmVuY2VNZXRhJylcbiAgICAgIHJldHVybiBvcGVuQWZ0ZXIoY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gOTYgJiYgY29kZSA9PT0gbWFya2VyKSByZXR1cm4gbm9rKGNvZGUpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIG1ldGFcbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW5BZnRlcihjb2RlKSB7XG4gICAgZWZmZWN0cy5leGl0KCdjb2RlRmVuY2VkRmVuY2UnKVxuICAgIHJldHVybiBzZWxmLmludGVycnVwdCA/IG9rKGNvZGUpIDogY29udGVudChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29udGVudChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBhZnRlcihjb2RlKVxuICAgIH1cblxuICAgIGlmIChtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ2xpbmVFbmRpbmcnKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2xpbmVFbmRpbmcnKVxuICAgICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChcbiAgICAgICAgY2xvc2luZ0ZlbmNlQ29uc3RydWN0LFxuICAgICAgICBhZnRlcixcbiAgICAgICAgaW5pdGlhbFByZWZpeFxuICAgICAgICAgID8gZmFjdG9yeVNwYWNlKGVmZmVjdHMsIGNvbnRlbnQsICdsaW5lUHJlZml4JywgaW5pdGlhbFByZWZpeCArIDEpXG4gICAgICAgICAgOiBjb250ZW50XG4gICAgICApXG4gICAgfVxuXG4gICAgZWZmZWN0cy5lbnRlcignY29kZUZsb3dWYWx1ZScpXG4gICAgcmV0dXJuIGNvbnRlbnRDb250aW51ZShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29udGVudENvbnRpbnVlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuZXhpdCgnY29kZUZsb3dWYWx1ZScpXG4gICAgICByZXR1cm4gY29udGVudChjb2RlKVxuICAgIH1cblxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIHJldHVybiBjb250ZW50Q29udGludWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGFmdGVyKGNvZGUpIHtcbiAgICBlZmZlY3RzLmV4aXQoJ2NvZGVGZW5jZWQnKVxuICAgIHJldHVybiBvayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW5pemVDbG9zaW5nRmVuY2UoZWZmZWN0cywgb2ssIG5vaykge1xuICAgIHZhciBzaXplID0gMFxuICAgIHJldHVybiBmYWN0b3J5U3BhY2UoXG4gICAgICBlZmZlY3RzLFxuICAgICAgY2xvc2luZ1NlcXVlbmNlU3RhcnQsXG4gICAgICAnbGluZVByZWZpeCcsXG4gICAgICB0aGlzLnBhcnNlci5jb25zdHJ1Y3RzLmRpc2FibGUubnVsbC5pbmRleE9mKCdjb2RlSW5kZW50ZWQnKSA+IC0xXG4gICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgIDogNFxuICAgIClcblxuICAgIGZ1bmN0aW9uIGNsb3NpbmdTZXF1ZW5jZVN0YXJ0KGNvZGUpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ2NvZGVGZW5jZWRGZW5jZScpXG4gICAgICBlZmZlY3RzLmVudGVyKCdjb2RlRmVuY2VkRmVuY2VTZXF1ZW5jZScpXG4gICAgICByZXR1cm4gY2xvc2luZ1NlcXVlbmNlKGNvZGUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2luZ1NlcXVlbmNlKGNvZGUpIHtcbiAgICAgIGlmIChjb2RlID09PSBtYXJrZXIpIHtcbiAgICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICAgIHNpemUrK1xuICAgICAgICByZXR1cm4gY2xvc2luZ1NlcXVlbmNlXG4gICAgICB9XG5cbiAgICAgIGlmIChzaXplIDwgc2l6ZU9wZW4pIHJldHVybiBub2soY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdCgnY29kZUZlbmNlZEZlbmNlU2VxdWVuY2UnKVxuICAgICAgcmV0dXJuIGZhY3RvcnlTcGFjZShlZmZlY3RzLCBjbG9zaW5nU2VxdWVuY2VFbmQsICd3aGl0ZXNwYWNlJykoY29kZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zaW5nU2VxdWVuY2VFbmQoY29kZSkge1xuICAgICAgaWYgKGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICAgIGVmZmVjdHMuZXhpdCgnY29kZUZlbmNlZEZlbmNlJylcbiAgICAgICAgcmV0dXJuIG9rKGNvZGUpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb2RlRmVuY2VkXG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1hcmtkb3duTGluZUVuZGluZyA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy5qcycpXG52YXIgY2h1bmtlZFNwbGljZSA9IHJlcXVpcmUoJy4uL3V0aWwvY2h1bmtlZC1zcGxpY2UuanMnKVxudmFyIHByZWZpeFNpemUgPSByZXF1aXJlKCcuLi91dGlsL3ByZWZpeC1zaXplLmpzJylcbnZhciBmYWN0b3J5U3BhY2UgPSByZXF1aXJlKCcuL2ZhY3Rvcnktc3BhY2UuanMnKVxuXG52YXIgY29kZUluZGVudGVkID0ge1xuICBuYW1lOiAnY29kZUluZGVudGVkJyxcbiAgdG9rZW5pemU6IHRva2VuaXplQ29kZUluZGVudGVkLFxuICByZXNvbHZlOiByZXNvbHZlQ29kZUluZGVudGVkXG59XG52YXIgaW5kZW50ZWRDb250ZW50Q29uc3RydWN0ID0ge1xuICB0b2tlbml6ZTogdG9rZW5pemVJbmRlbnRlZENvbnRlbnQsXG4gIHBhcnRpYWw6IHRydWVcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUNvZGVJbmRlbnRlZChldmVudHMsIGNvbnRleHQpIHtcbiAgdmFyIGNvZGUgPSB7XG4gICAgdHlwZTogJ2NvZGVJbmRlbnRlZCcsXG4gICAgc3RhcnQ6IGV2ZW50c1swXVsxXS5zdGFydCxcbiAgICBlbmQ6IGV2ZW50c1tldmVudHMubGVuZ3RoIC0gMV1bMV0uZW5kXG4gIH1cbiAgY2h1bmtlZFNwbGljZShldmVudHMsIDAsIDAsIFtbJ2VudGVyJywgY29kZSwgY29udGV4dF1dKVxuICBjaHVua2VkU3BsaWNlKGV2ZW50cywgZXZlbnRzLmxlbmd0aCwgMCwgW1snZXhpdCcsIGNvZGUsIGNvbnRleHRdXSlcbiAgcmV0dXJuIGV2ZW50c1xufVxuXG5mdW5jdGlvbiB0b2tlbml6ZUNvZGVJbmRlbnRlZChlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHJldHVybiBlZmZlY3RzLmF0dGVtcHQoaW5kZW50ZWRDb250ZW50Q29uc3RydWN0LCBhZnRlclByZWZpeCwgbm9rKVxuXG4gIGZ1bmN0aW9uIGFmdGVyUHJlZml4KGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG9rKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChpbmRlbnRlZENvbnRlbnRDb25zdHJ1Y3QsIGFmdGVyUHJlZml4LCBvaykoY29kZSlcbiAgICB9XG5cbiAgICBlZmZlY3RzLmVudGVyKCdjb2RlRmxvd1ZhbHVlJylcbiAgICByZXR1cm4gY29udGVudChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29udGVudChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ2NvZGVGbG93VmFsdWUnKVxuICAgICAgcmV0dXJuIGFmdGVyUHJlZml4KGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIGNvbnRlbnRcbiAgfVxufVxuXG5mdW5jdGlvbiB0b2tlbml6ZUluZGVudGVkQ29udGVudChlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICByZXR1cm4gZmFjdG9yeVNwYWNlKGVmZmVjdHMsIGFmdGVyUHJlZml4LCAnbGluZVByZWZpeCcsIDQgKyAxKVxuXG4gIGZ1bmN0aW9uIGFmdGVyUHJlZml4KGNvZGUpIHtcbiAgICBpZiAobWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdsaW5lRW5kaW5nJylcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KCdsaW5lRW5kaW5nJylcbiAgICAgIHJldHVybiBmYWN0b3J5U3BhY2UoZWZmZWN0cywgYWZ0ZXJQcmVmaXgsICdsaW5lUHJlZml4JywgNCArIDEpXG4gICAgfVxuXG4gICAgcmV0dXJuIHByZWZpeFNpemUoc2VsZi5ldmVudHMsICdsaW5lUHJlZml4JykgPCA0ID8gbm9rKGNvZGUpIDogb2soY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvZGVJbmRlbnRlZFxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBhc2NpaUNvbnRyb2wgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvYXNjaWktY29udHJvbC5qcycpXG52YXIgbWFya2Rvd25MaW5lRW5kaW5nT3JTcGFjZSA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy1vci1zcGFjZS5qcycpXG52YXIgbWFya2Rvd25MaW5lRW5kaW5nID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLWxpbmUtZW5kaW5nLmpzJylcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1wYXJhbXNcbmZ1bmN0aW9uIGRlc3RpbmF0aW9uRmFjdG9yeShcbiAgZWZmZWN0cyxcbiAgb2ssXG4gIG5vayxcbiAgdHlwZSxcbiAgbGl0ZXJhbFR5cGUsXG4gIGxpdGVyYWxNYXJrZXJUeXBlLFxuICByYXdUeXBlLFxuICBzdHJpbmdUeXBlLFxuICBtYXhcbikge1xuICB2YXIgbGltaXQgPSBtYXggfHwgSW5maW5pdHlcbiAgdmFyIGJhbGFuY2UgPSAwXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNjApIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIodHlwZSlcbiAgICAgIGVmZmVjdHMuZW50ZXIobGl0ZXJhbFR5cGUpXG4gICAgICBlZmZlY3RzLmVudGVyKGxpdGVyYWxNYXJrZXJUeXBlKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQobGl0ZXJhbE1hcmtlclR5cGUpXG4gICAgICByZXR1cm4gZGVzdGluYXRpb25FbmNsb3NlZEJlZm9yZVxuICAgIH1cblxuICAgIGlmIChhc2NpaUNvbnRyb2woY29kZSkgfHwgY29kZSA9PT0gNDEpIHtcbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG5cbiAgICBlZmZlY3RzLmVudGVyKHR5cGUpXG4gICAgZWZmZWN0cy5lbnRlcihyYXdUeXBlKVxuICAgIGVmZmVjdHMuZW50ZXIoc3RyaW5nVHlwZSlcbiAgICBlZmZlY3RzLmVudGVyKCdjaHVua1N0cmluZycsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnc3RyaW5nJ1xuICAgIH0pXG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uUmF3KGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBkZXN0aW5hdGlvbkVuY2xvc2VkQmVmb3JlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNjIpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIobGl0ZXJhbE1hcmtlclR5cGUpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdChsaXRlcmFsTWFya2VyVHlwZSlcbiAgICAgIGVmZmVjdHMuZXhpdChsaXRlcmFsVHlwZSlcbiAgICAgIGVmZmVjdHMuZXhpdCh0eXBlKVxuICAgICAgcmV0dXJuIG9rXG4gICAgfVxuXG4gICAgZWZmZWN0cy5lbnRlcihzdHJpbmdUeXBlKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2NodW5rU3RyaW5nJywge1xuICAgICAgY29udGVudFR5cGU6ICdzdHJpbmcnXG4gICAgfSlcbiAgICByZXR1cm4gZGVzdGluYXRpb25FbmNsb3NlZChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVzdGluYXRpb25FbmNsb3NlZChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDYyKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ2NodW5rU3RyaW5nJylcbiAgICAgIGVmZmVjdHMuZXhpdChzdHJpbmdUeXBlKVxuICAgICAgcmV0dXJuIGRlc3RpbmF0aW9uRW5jbG9zZWRCZWZvcmUoY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBjb2RlID09PSA2MCB8fCBtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG5cbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICByZXR1cm4gY29kZSA9PT0gOTIgPyBkZXN0aW5hdGlvbkVuY2xvc2VkRXNjYXBlIDogZGVzdGluYXRpb25FbmNsb3NlZFxuICB9XG5cbiAgZnVuY3Rpb24gZGVzdGluYXRpb25FbmNsb3NlZEVzY2FwZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDYwIHx8IGNvZGUgPT09IDYyIHx8IGNvZGUgPT09IDkyKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBkZXN0aW5hdGlvbkVuY2xvc2VkXG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uRW5jbG9zZWQoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3RpbmF0aW9uUmF3KGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNDApIHtcbiAgICAgIGlmICgrK2JhbGFuY2UgPiBsaW1pdCkgcmV0dXJuIG5vayhjb2RlKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gZGVzdGluYXRpb25SYXdcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gNDEpIHtcbiAgICAgIGlmICghYmFsYW5jZS0tKSB7XG4gICAgICAgIGVmZmVjdHMuZXhpdCgnY2h1bmtTdHJpbmcnKVxuICAgICAgICBlZmZlY3RzLmV4aXQoc3RyaW5nVHlwZSlcbiAgICAgICAgZWZmZWN0cy5leGl0KHJhd1R5cGUpXG4gICAgICAgIGVmZmVjdHMuZXhpdCh0eXBlKVxuICAgICAgICByZXR1cm4gb2soY29kZSlcbiAgICAgIH1cblxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gZGVzdGluYXRpb25SYXdcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBtYXJrZG93bkxpbmVFbmRpbmdPclNwYWNlKGNvZGUpKSB7XG4gICAgICBpZiAoYmFsYW5jZSkgcmV0dXJuIG5vayhjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KCdjaHVua1N0cmluZycpXG4gICAgICBlZmZlY3RzLmV4aXQoc3RyaW5nVHlwZSlcbiAgICAgIGVmZmVjdHMuZXhpdChyYXdUeXBlKVxuICAgICAgZWZmZWN0cy5leGl0KHR5cGUpXG4gICAgICByZXR1cm4gb2soY29kZSlcbiAgICB9XG5cbiAgICBpZiAoYXNjaWlDb250cm9sKGNvZGUpKSByZXR1cm4gbm9rKGNvZGUpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIGNvZGUgPT09IDkyID8gZGVzdGluYXRpb25SYXdFc2NhcGUgOiBkZXN0aW5hdGlvblJhd1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzdGluYXRpb25SYXdFc2NhcGUoY29kZSkge1xuICAgIGlmIChjb2RlID09PSA0MCB8fCBjb2RlID09PSA0MSB8fCBjb2RlID09PSA5Mikge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gZGVzdGluYXRpb25SYXdcbiAgICB9XG5cbiAgICByZXR1cm4gZGVzdGluYXRpb25SYXcoY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlc3RpbmF0aW9uRmFjdG9yeVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBtYXJrZG93bkxpbmVFbmRpbmcgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmcuanMnKVxudmFyIG1hcmtkb3duU3BhY2UgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tc3BhY2UuanMnKVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LXBhcmFtc1xuZnVuY3Rpb24gbGFiZWxGYWN0b3J5KGVmZmVjdHMsIG9rLCBub2ssIHR5cGUsIG1hcmtlclR5cGUsIHN0cmluZ1R5cGUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHZhciBzaXplID0gMFxuICB2YXIgZGF0YVxuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgZWZmZWN0cy5lbnRlcih0eXBlKVxuICAgIGVmZmVjdHMuZW50ZXIobWFya2VyVHlwZSlcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQobWFya2VyVHlwZSlcbiAgICBlZmZlY3RzLmVudGVyKHN0cmluZ1R5cGUpXG4gICAgcmV0dXJuIGF0QnJlYWtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF0QnJlYWsoY29kZSkge1xuICAgIGlmIChcbiAgICAgIGNvZGUgPT09IG51bGwgfHxcbiAgICAgIGNvZGUgPT09IDkxIHx8XG4gICAgICAoY29kZSA9PT0gOTMgJiYgIWRhdGEpIHx8XG4gICAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgICAgKGNvZGUgPT09IDk0ICYmXG4gICAgICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgICAgICFzaXplICYmXG4gICAgICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgICAgICdfaGlkZGVuRm9vdG5vdGVTdXBwb3J0JyBpbiBzZWxmLnBhcnNlci5jb25zdHJ1Y3RzKSB8fFxuICAgICAgc2l6ZSA+IDk5OVxuICAgICkge1xuICAgICAgcmV0dXJuIG5vayhjb2RlKVxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA5Mykge1xuICAgICAgZWZmZWN0cy5leGl0KHN0cmluZ1R5cGUpXG4gICAgICBlZmZlY3RzLmVudGVyKG1hcmtlclR5cGUpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdChtYXJrZXJUeXBlKVxuICAgICAgZWZmZWN0cy5leGl0KHR5cGUpXG4gICAgICByZXR1cm4gb2tcbiAgICB9XG5cbiAgICBpZiAobWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdsaW5lRW5kaW5nJylcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KCdsaW5lRW5kaW5nJylcbiAgICAgIHJldHVybiBhdEJyZWFrXG4gICAgfVxuXG4gICAgZWZmZWN0cy5lbnRlcignY2h1bmtTdHJpbmcnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ3N0cmluZydcbiAgICB9KVxuICAgIHJldHVybiBsYWJlbChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gbGFiZWwoY29kZSkge1xuICAgIGlmIChcbiAgICAgIGNvZGUgPT09IG51bGwgfHxcbiAgICAgIGNvZGUgPT09IDkxIHx8XG4gICAgICBjb2RlID09PSA5MyB8fFxuICAgICAgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpIHx8XG4gICAgICBzaXplKysgPiA5OTlcbiAgICApIHtcbiAgICAgIGVmZmVjdHMuZXhpdCgnY2h1bmtTdHJpbmcnKVxuICAgICAgcmV0dXJuIGF0QnJlYWsoY29kZSlcbiAgICB9XG5cbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBkYXRhID0gZGF0YSB8fCAhbWFya2Rvd25TcGFjZShjb2RlKVxuICAgIHJldHVybiBjb2RlID09PSA5MiA/IGxhYmVsRXNjYXBlIDogbGFiZWxcbiAgfVxuXG4gIGZ1bmN0aW9uIGxhYmVsRXNjYXBlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gOTEgfHwgY29kZSA9PT0gOTIgfHwgY29kZSA9PT0gOTMpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgc2l6ZSsrXG4gICAgICByZXR1cm4gbGFiZWxcbiAgICB9XG5cbiAgICByZXR1cm4gbGFiZWwoY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxhYmVsRmFjdG9yeVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBtYXJrZG93bkxpbmVFbmRpbmcgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmcuanMnKVxudmFyIG1hcmtkb3duU3BhY2UgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tc3BhY2UuanMnKVxudmFyIGZhY3RvcnlTcGFjZSA9IHJlcXVpcmUoJy4vZmFjdG9yeS1zcGFjZS5qcycpXG5cbmZ1bmN0aW9uIHdoaXRlc3BhY2VGYWN0b3J5KGVmZmVjdHMsIG9rKSB7XG4gIHZhciBzZWVuXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBpZiAobWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdsaW5lRW5kaW5nJylcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KCdsaW5lRW5kaW5nJylcbiAgICAgIHNlZW4gPSB0cnVlXG4gICAgICByZXR1cm4gc3RhcnRcbiAgICB9XG5cbiAgICBpZiAobWFya2Rvd25TcGFjZShjb2RlKSkge1xuICAgICAgcmV0dXJuIGZhY3RvcnlTcGFjZShcbiAgICAgICAgZWZmZWN0cyxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHNlZW4gPyAnbGluZVByZWZpeCcgOiAnbGluZVN1ZmZpeCdcbiAgICAgICkoY29kZSlcbiAgICB9XG5cbiAgICByZXR1cm4gb2soY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdoaXRlc3BhY2VGYWN0b3J5XG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1hcmtkb3duTGluZUVuZGluZyA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy5qcycpXG52YXIgZmFjdG9yeVNwYWNlID0gcmVxdWlyZSgnLi9mYWN0b3J5LXNwYWNlLmpzJylcblxuZnVuY3Rpb24gdGl0bGVGYWN0b3J5KGVmZmVjdHMsIG9rLCBub2ssIHR5cGUsIG1hcmtlclR5cGUsIHN0cmluZ1R5cGUpIHtcbiAgdmFyIG1hcmtlclxuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgZWZmZWN0cy5lbnRlcih0eXBlKVxuICAgIGVmZmVjdHMuZW50ZXIobWFya2VyVHlwZSlcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQobWFya2VyVHlwZSlcbiAgICBtYXJrZXIgPSBjb2RlID09PSA0MCA/IDQxIDogY29kZVxuICAgIHJldHVybiBhdEZpcnN0VGl0bGVCcmVha1xuICB9XG5cbiAgZnVuY3Rpb24gYXRGaXJzdFRpdGxlQnJlYWsoY29kZSkge1xuICAgIGlmIChjb2RlID09PSBtYXJrZXIpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIobWFya2VyVHlwZSlcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KG1hcmtlclR5cGUpXG4gICAgICBlZmZlY3RzLmV4aXQodHlwZSlcbiAgICAgIHJldHVybiBva1xuICAgIH1cblxuICAgIGVmZmVjdHMuZW50ZXIoc3RyaW5nVHlwZSlcbiAgICByZXR1cm4gYXRUaXRsZUJyZWFrKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBhdFRpdGxlQnJlYWsoY29kZSkge1xuICAgIGlmIChjb2RlID09PSBtYXJrZXIpIHtcbiAgICAgIGVmZmVjdHMuZXhpdChzdHJpbmdUeXBlKVxuICAgICAgcmV0dXJuIGF0Rmlyc3RUaXRsZUJyZWFrKG1hcmtlcilcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG5vayhjb2RlKVxuICAgIH0gLy8gTm90ZTogYmxhbmsgbGluZXMgY2Fu4oCZdCBleGlzdCBpbiBjb250ZW50LlxuXG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgZWZmZWN0cy5lbnRlcignbGluZUVuZGluZycpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdCgnbGluZUVuZGluZycpXG4gICAgICByZXR1cm4gZmFjdG9yeVNwYWNlKGVmZmVjdHMsIGF0VGl0bGVCcmVhaywgJ2xpbmVQcmVmaXgnKVxuICAgIH1cblxuICAgIGVmZmVjdHMuZW50ZXIoJ2NodW5rU3RyaW5nJywge1xuICAgICAgY29udGVudFR5cGU6ICdzdHJpbmcnXG4gICAgfSlcbiAgICByZXR1cm4gdGl0bGUoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpdGxlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbWFya2VyIHx8IGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ2NodW5rU3RyaW5nJylcbiAgICAgIHJldHVybiBhdFRpdGxlQnJlYWsoY29kZSlcbiAgICB9XG5cbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICByZXR1cm4gY29kZSA9PT0gOTIgPyB0aXRsZUVzY2FwZSA6IHRpdGxlXG4gIH1cblxuICBmdW5jdGlvbiB0aXRsZUVzY2FwZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG1hcmtlciB8fCBjb2RlID09PSA5Mikge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gdGl0bGVcbiAgICB9XG5cbiAgICByZXR1cm4gdGl0bGUoY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRpdGxlRmFjdG9yeVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBtYXJrZG93bkxpbmVFbmRpbmcgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmcuanMnKVxudmFyIG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmctb3Itc3BhY2UuanMnKVxudmFyIG5vcm1hbGl6ZUlkZW50aWZpZXIgPSByZXF1aXJlKCcuLi91dGlsL25vcm1hbGl6ZS1pZGVudGlmaWVyLmpzJylcbnZhciBmYWN0b3J5RGVzdGluYXRpb24gPSByZXF1aXJlKCcuL2ZhY3RvcnktZGVzdGluYXRpb24uanMnKVxudmFyIGZhY3RvcnlMYWJlbCA9IHJlcXVpcmUoJy4vZmFjdG9yeS1sYWJlbC5qcycpXG52YXIgZmFjdG9yeVNwYWNlID0gcmVxdWlyZSgnLi9mYWN0b3J5LXNwYWNlLmpzJylcbnZhciBmYWN0b3J5V2hpdGVzcGFjZSA9IHJlcXVpcmUoJy4vZmFjdG9yeS13aGl0ZXNwYWNlLmpzJylcbnZhciBmYWN0b3J5VGl0bGUgPSByZXF1aXJlKCcuL2ZhY3RvcnktdGl0bGUuanMnKVxuXG52YXIgZGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ2RlZmluaXRpb24nLFxuICB0b2tlbml6ZTogdG9rZW5pemVEZWZpbml0aW9uXG59XG52YXIgdGl0bGVDb25zdHJ1Y3QgPSB7XG4gIHRva2VuaXplOiB0b2tlbml6ZVRpdGxlLFxuICBwYXJ0aWFsOiB0cnVlXG59XG5cbmZ1bmN0aW9uIHRva2VuaXplRGVmaW5pdGlvbihlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICB2YXIgaWRlbnRpZmllclxuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgZWZmZWN0cy5lbnRlcignZGVmaW5pdGlvbicpXG4gICAgcmV0dXJuIGZhY3RvcnlMYWJlbC5jYWxsKFxuICAgICAgc2VsZixcbiAgICAgIGVmZmVjdHMsXG4gICAgICBsYWJlbEFmdGVyLFxuICAgICAgbm9rLFxuICAgICAgJ2RlZmluaXRpb25MYWJlbCcsXG4gICAgICAnZGVmaW5pdGlvbkxhYmVsTWFya2VyJyxcbiAgICAgICdkZWZpbml0aW9uTGFiZWxTdHJpbmcnXG4gICAgKShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gbGFiZWxBZnRlcihjb2RlKSB7XG4gICAgaWRlbnRpZmllciA9IG5vcm1hbGl6ZUlkZW50aWZpZXIoXG4gICAgICBzZWxmLnNsaWNlU2VyaWFsaXplKHNlbGYuZXZlbnRzW3NlbGYuZXZlbnRzLmxlbmd0aCAtIDFdWzFdKS5zbGljZSgxLCAtMSlcbiAgICApXG5cbiAgICBpZiAoY29kZSA9PT0gNTgpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ2RlZmluaXRpb25NYXJrZXInKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2RlZmluaXRpb25NYXJrZXInKSAvLyBOb3RlOiBibGFuayBsaW5lcyBjYW7igJl0IGV4aXN0IGluIGNvbnRlbnQuXG5cbiAgICAgIHJldHVybiBmYWN0b3J5V2hpdGVzcGFjZShcbiAgICAgICAgZWZmZWN0cyxcbiAgICAgICAgZmFjdG9yeURlc3RpbmF0aW9uKFxuICAgICAgICAgIGVmZmVjdHMsXG4gICAgICAgICAgZWZmZWN0cy5hdHRlbXB0KFxuICAgICAgICAgICAgdGl0bGVDb25zdHJ1Y3QsXG4gICAgICAgICAgICBmYWN0b3J5U3BhY2UoZWZmZWN0cywgYWZ0ZXIsICd3aGl0ZXNwYWNlJyksXG4gICAgICAgICAgICBmYWN0b3J5U3BhY2UoZWZmZWN0cywgYWZ0ZXIsICd3aGl0ZXNwYWNlJylcbiAgICAgICAgICApLFxuICAgICAgICAgIG5vayxcbiAgICAgICAgICAnZGVmaW5pdGlvbkRlc3RpbmF0aW9uJyxcbiAgICAgICAgICAnZGVmaW5pdGlvbkRlc3RpbmF0aW9uTGl0ZXJhbCcsXG4gICAgICAgICAgJ2RlZmluaXRpb25EZXN0aW5hdGlvbkxpdGVyYWxNYXJrZXInLFxuICAgICAgICAgICdkZWZpbml0aW9uRGVzdGluYXRpb25SYXcnLFxuICAgICAgICAgICdkZWZpbml0aW9uRGVzdGluYXRpb25TdHJpbmcnXG4gICAgICAgIClcbiAgICAgIClcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBhZnRlcihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ2RlZmluaXRpb24nKVxuXG4gICAgICBpZiAoc2VsZi5wYXJzZXIuZGVmaW5lZC5pbmRleE9mKGlkZW50aWZpZXIpIDwgMCkge1xuICAgICAgICBzZWxmLnBhcnNlci5kZWZpbmVkLnB1c2goaWRlbnRpZmllcilcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG9rKGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG59XG5cbmZ1bmN0aW9uIHRva2VuaXplVGl0bGUoZWZmZWN0cywgb2ssIG5vaykge1xuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgcmV0dXJuIG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UoY29kZSlcbiAgICAgID8gZmFjdG9yeVdoaXRlc3BhY2UoZWZmZWN0cywgYmVmb3JlKShjb2RlKVxuICAgICAgOiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGJlZm9yZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDM0IHx8IGNvZGUgPT09IDM5IHx8IGNvZGUgPT09IDQwKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeVRpdGxlKFxuICAgICAgICBlZmZlY3RzLFxuICAgICAgICBmYWN0b3J5U3BhY2UoZWZmZWN0cywgYWZ0ZXIsICd3aGl0ZXNwYWNlJyksXG4gICAgICAgIG5vayxcbiAgICAgICAgJ2RlZmluaXRpb25UaXRsZScsXG4gICAgICAgICdkZWZpbml0aW9uVGl0bGVNYXJrZXInLFxuICAgICAgICAnZGVmaW5pdGlvblRpdGxlU3RyaW5nJ1xuICAgICAgKShjb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGFmdGVyKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZSA9PT0gbnVsbCB8fCBtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkgPyBvayhjb2RlKSA6IG5vayhjb2RlKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvblxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBtYXJrZG93bkxpbmVFbmRpbmcgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmcuanMnKVxuXG52YXIgaGFyZEJyZWFrRXNjYXBlID0ge1xuICBuYW1lOiAnaGFyZEJyZWFrRXNjYXBlJyxcbiAgdG9rZW5pemU6IHRva2VuaXplSGFyZEJyZWFrRXNjYXBlXG59XG5cbmZ1bmN0aW9uIHRva2VuaXplSGFyZEJyZWFrRXNjYXBlKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgcmV0dXJuIHN0YXJ0XG5cbiAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgIGVmZmVjdHMuZW50ZXIoJ2hhcmRCcmVha0VzY2FwZScpXG4gICAgZWZmZWN0cy5lbnRlcignZXNjYXBlTWFya2VyJylcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICByZXR1cm4gb3BlblxuICB9XG5cbiAgZnVuY3Rpb24gb3Blbihjb2RlKSB7XG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgZWZmZWN0cy5leGl0KCdlc2NhcGVNYXJrZXInKVxuICAgICAgZWZmZWN0cy5leGl0KCdoYXJkQnJlYWtFc2NhcGUnKVxuICAgICAgcmV0dXJuIG9rKGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaGFyZEJyZWFrRXNjYXBlXG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1hcmtkb3duTGluZUVuZGluZyA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy5qcycpXG52YXIgbWFya2Rvd25MaW5lRW5kaW5nT3JTcGFjZSA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy1vci1zcGFjZS5qcycpXG52YXIgbWFya2Rvd25TcGFjZSA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1zcGFjZS5qcycpXG52YXIgY2h1bmtlZFNwbGljZSA9IHJlcXVpcmUoJy4uL3V0aWwvY2h1bmtlZC1zcGxpY2UuanMnKVxudmFyIGZhY3RvcnlTcGFjZSA9IHJlcXVpcmUoJy4vZmFjdG9yeS1zcGFjZS5qcycpXG5cbnZhciBoZWFkaW5nQXR4ID0ge1xuICBuYW1lOiAnaGVhZGluZ0F0eCcsXG4gIHRva2VuaXplOiB0b2tlbml6ZUhlYWRpbmdBdHgsXG4gIHJlc29sdmU6IHJlc29sdmVIZWFkaW5nQXR4XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVIZWFkaW5nQXR4KGV2ZW50cywgY29udGV4dCkge1xuICB2YXIgY29udGVudEVuZCA9IGV2ZW50cy5sZW5ndGggLSAyXG4gIHZhciBjb250ZW50U3RhcnQgPSAzXG4gIHZhciBjb250ZW50XG4gIHZhciB0ZXh0IC8vIFByZWZpeCB3aGl0ZXNwYWNlLCBwYXJ0IG9mIHRoZSBvcGVuaW5nLlxuXG4gIGlmIChldmVudHNbY29udGVudFN0YXJ0XVsxXS50eXBlID09PSAnd2hpdGVzcGFjZScpIHtcbiAgICBjb250ZW50U3RhcnQgKz0gMlxuICB9IC8vIFN1ZmZpeCB3aGl0ZXNwYWNlLCBwYXJ0IG9mIHRoZSBjbG9zaW5nLlxuXG4gIGlmIChcbiAgICBjb250ZW50RW5kIC0gMiA+IGNvbnRlbnRTdGFydCAmJlxuICAgIGV2ZW50c1tjb250ZW50RW5kXVsxXS50eXBlID09PSAnd2hpdGVzcGFjZSdcbiAgKSB7XG4gICAgY29udGVudEVuZCAtPSAyXG4gIH1cblxuICBpZiAoXG4gICAgZXZlbnRzW2NvbnRlbnRFbmRdWzFdLnR5cGUgPT09ICdhdHhIZWFkaW5nU2VxdWVuY2UnICYmXG4gICAgKGNvbnRlbnRTdGFydCA9PT0gY29udGVudEVuZCAtIDEgfHxcbiAgICAgIChjb250ZW50RW5kIC0gNCA+IGNvbnRlbnRTdGFydCAmJlxuICAgICAgICBldmVudHNbY29udGVudEVuZCAtIDJdWzFdLnR5cGUgPT09ICd3aGl0ZXNwYWNlJykpXG4gICkge1xuICAgIGNvbnRlbnRFbmQgLT0gY29udGVudFN0YXJ0ICsgMSA9PT0gY29udGVudEVuZCA/IDIgOiA0XG4gIH1cblxuICBpZiAoY29udGVudEVuZCA+IGNvbnRlbnRTdGFydCkge1xuICAgIGNvbnRlbnQgPSB7XG4gICAgICB0eXBlOiAnYXR4SGVhZGluZ1RleHQnLFxuICAgICAgc3RhcnQ6IGV2ZW50c1tjb250ZW50U3RhcnRdWzFdLnN0YXJ0LFxuICAgICAgZW5kOiBldmVudHNbY29udGVudEVuZF1bMV0uZW5kXG4gICAgfVxuICAgIHRleHQgPSB7XG4gICAgICB0eXBlOiAnY2h1bmtUZXh0JyxcbiAgICAgIHN0YXJ0OiBldmVudHNbY29udGVudFN0YXJ0XVsxXS5zdGFydCxcbiAgICAgIGVuZDogZXZlbnRzW2NvbnRlbnRFbmRdWzFdLmVuZCxcbiAgICAgIGNvbnRlbnRUeXBlOiAndGV4dCdcbiAgICB9XG4gICAgY2h1bmtlZFNwbGljZShldmVudHMsIGNvbnRlbnRTdGFydCwgY29udGVudEVuZCAtIGNvbnRlbnRTdGFydCArIDEsIFtcbiAgICAgIFsnZW50ZXInLCBjb250ZW50LCBjb250ZXh0XSxcbiAgICAgIFsnZW50ZXInLCB0ZXh0LCBjb250ZXh0XSxcbiAgICAgIFsnZXhpdCcsIHRleHQsIGNvbnRleHRdLFxuICAgICAgWydleGl0JywgY29udGVudCwgY29udGV4dF1cbiAgICBdKVxuICB9XG5cbiAgcmV0dXJuIGV2ZW50c1xufVxuXG5mdW5jdGlvbiB0b2tlbml6ZUhlYWRpbmdBdHgoZWZmZWN0cywgb2ssIG5vaykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgdmFyIHNpemUgPSAwXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdhdHhIZWFkaW5nJylcbiAgICBlZmZlY3RzLmVudGVyKCdhdHhIZWFkaW5nU2VxdWVuY2UnKVxuICAgIHJldHVybiBmZW5jZU9wZW5JbnNpZGUoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGZlbmNlT3Blbkluc2lkZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDM1ICYmIHNpemUrKyA8IDYpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGZlbmNlT3Blbkluc2lkZVxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSBudWxsIHx8IG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuZXhpdCgnYXR4SGVhZGluZ1NlcXVlbmNlJylcbiAgICAgIHJldHVybiBzZWxmLmludGVycnVwdCA/IG9rKGNvZGUpIDogaGVhZGluZ0JyZWFrKGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gaGVhZGluZ0JyZWFrKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gMzUpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ2F0eEhlYWRpbmdTZXF1ZW5jZScpXG4gICAgICByZXR1cm4gc2VxdWVuY2UoY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuZXhpdCgnYXR4SGVhZGluZycpXG4gICAgICByZXR1cm4gb2soY29kZSlcbiAgICB9XG5cbiAgICBpZiAobWFya2Rvd25TcGFjZShjb2RlKSkge1xuICAgICAgcmV0dXJuIGZhY3RvcnlTcGFjZShlZmZlY3RzLCBoZWFkaW5nQnJlYWssICd3aGl0ZXNwYWNlJykoY29kZSlcbiAgICB9XG5cbiAgICBlZmZlY3RzLmVudGVyKCdhdHhIZWFkaW5nVGV4dCcpXG4gICAgcmV0dXJuIGRhdGEoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcXVlbmNlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gMzUpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIHNlcXVlbmNlXG4gICAgfVxuXG4gICAgZWZmZWN0cy5leGl0KCdhdHhIZWFkaW5nU2VxdWVuY2UnKVxuICAgIHJldHVybiBoZWFkaW5nQnJlYWsoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRhdGEoY29kZSkge1xuICAgIGlmIChjb2RlID09PSBudWxsIHx8IGNvZGUgPT09IDM1IHx8IG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuZXhpdCgnYXR4SGVhZGluZ1RleHQnKVxuICAgICAgcmV0dXJuIGhlYWRpbmdCcmVhayhjb2RlKVxuICAgIH1cblxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIHJldHVybiBkYXRhXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoZWFkaW5nQXR4XG4iLCIndXNlIHN0cmljdCdcblxuLy8gVGhpcyBtb2R1bGUgaXMgY29waWVkIGZyb20gPGh0dHBzOi8vc3BlYy5jb21tb25tYXJrLm9yZy8wLjI5LyNodG1sLWJsb2Nrcz4uXG52YXIgYmFzaWNzID0gW1xuICAnYWRkcmVzcycsXG4gICdhcnRpY2xlJyxcbiAgJ2FzaWRlJyxcbiAgJ2Jhc2UnLFxuICAnYmFzZWZvbnQnLFxuICAnYmxvY2txdW90ZScsXG4gICdib2R5JyxcbiAgJ2NhcHRpb24nLFxuICAnY2VudGVyJyxcbiAgJ2NvbCcsXG4gICdjb2xncm91cCcsXG4gICdkZCcsXG4gICdkZXRhaWxzJyxcbiAgJ2RpYWxvZycsXG4gICdkaXInLFxuICAnZGl2JyxcbiAgJ2RsJyxcbiAgJ2R0JyxcbiAgJ2ZpZWxkc2V0JyxcbiAgJ2ZpZ2NhcHRpb24nLFxuICAnZmlndXJlJyxcbiAgJ2Zvb3RlcicsXG4gICdmb3JtJyxcbiAgJ2ZyYW1lJyxcbiAgJ2ZyYW1lc2V0JyxcbiAgJ2gxJyxcbiAgJ2gyJyxcbiAgJ2gzJyxcbiAgJ2g0JyxcbiAgJ2g1JyxcbiAgJ2g2JyxcbiAgJ2hlYWQnLFxuICAnaGVhZGVyJyxcbiAgJ2hyJyxcbiAgJ2h0bWwnLFxuICAnaWZyYW1lJyxcbiAgJ2xlZ2VuZCcsXG4gICdsaScsXG4gICdsaW5rJyxcbiAgJ21haW4nLFxuICAnbWVudScsXG4gICdtZW51aXRlbScsXG4gICduYXYnLFxuICAnbm9mcmFtZXMnLFxuICAnb2wnLFxuICAnb3B0Z3JvdXAnLFxuICAnb3B0aW9uJyxcbiAgJ3AnLFxuICAncGFyYW0nLFxuICAnc2VjdGlvbicsXG4gICdzb3VyY2UnLFxuICAnc3VtbWFyeScsXG4gICd0YWJsZScsXG4gICd0Ym9keScsXG4gICd0ZCcsXG4gICd0Zm9vdCcsXG4gICd0aCcsXG4gICd0aGVhZCcsXG4gICd0aXRsZScsXG4gICd0cicsXG4gICd0cmFjaycsXG4gICd1bCdcbl1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNpY3NcbiIsIid1c2Ugc3RyaWN0J1xuXG4vLyBUaGlzIG1vZHVsZSBpcyBjb3BpZWQgZnJvbSA8aHR0cHM6Ly9zcGVjLmNvbW1vbm1hcmsub3JnLzAuMjkvI2h0bWwtYmxvY2tzPi5cbnZhciByYXdzID0gWydwcmUnLCAnc2NyaXB0JywgJ3N0eWxlJywgJ3RleHRhcmVhJ11cblxubW9kdWxlLmV4cG9ydHMgPSByYXdzXG4iLCIndXNlIHN0cmljdCdcblxudmFyIGFzY2lpQWxwaGEgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvYXNjaWktYWxwaGEuanMnKVxudmFyIGFzY2lpQWxwaGFudW1lcmljID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL2FzY2lpLWFscGhhbnVtZXJpYy5qcycpXG52YXIgbWFya2Rvd25MaW5lRW5kaW5nID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLWxpbmUtZW5kaW5nLmpzJylcbnZhciBtYXJrZG93bkxpbmVFbmRpbmdPclNwYWNlID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLWxpbmUtZW5kaW5nLW9yLXNwYWNlLmpzJylcbnZhciBtYXJrZG93blNwYWNlID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLXNwYWNlLmpzJylcbnZhciBmcm9tQ2hhckNvZGUgPSByZXF1aXJlKCcuLi9jb25zdGFudC9mcm9tLWNoYXItY29kZS5qcycpXG52YXIgaHRtbEJsb2NrTmFtZXMgPSByZXF1aXJlKCcuLi9jb25zdGFudC9odG1sLWJsb2NrLW5hbWVzLmpzJylcbnZhciBodG1sUmF3TmFtZXMgPSByZXF1aXJlKCcuLi9jb25zdGFudC9odG1sLXJhdy1uYW1lcy5qcycpXG52YXIgcGFydGlhbEJsYW5rTGluZSA9IHJlcXVpcmUoJy4vcGFydGlhbC1ibGFuay1saW5lLmpzJylcblxudmFyIGh0bWxGbG93ID0ge1xuICBuYW1lOiAnaHRtbEZsb3cnLFxuICB0b2tlbml6ZTogdG9rZW5pemVIdG1sRmxvdyxcbiAgcmVzb2x2ZVRvOiByZXNvbHZlVG9IdG1sRmxvdyxcbiAgY29uY3JldGU6IHRydWVcbn1cbnZhciBuZXh0QmxhbmtDb25zdHJ1Y3QgPSB7XG4gIHRva2VuaXplOiB0b2tlbml6ZU5leHRCbGFuayxcbiAgcGFydGlhbDogdHJ1ZVxufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9IdG1sRmxvdyhldmVudHMpIHtcbiAgdmFyIGluZGV4ID0gZXZlbnRzLmxlbmd0aFxuXG4gIHdoaWxlIChpbmRleC0tKSB7XG4gICAgaWYgKGV2ZW50c1tpbmRleF1bMF0gPT09ICdlbnRlcicgJiYgZXZlbnRzW2luZGV4XVsxXS50eXBlID09PSAnaHRtbEZsb3cnKSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmIChpbmRleCA+IDEgJiYgZXZlbnRzW2luZGV4IC0gMl1bMV0udHlwZSA9PT0gJ2xpbmVQcmVmaXgnKSB7XG4gICAgLy8gQWRkIHRoZSBwcmVmaXggc3RhcnQgdG8gdGhlIEhUTUwgdG9rZW4uXG4gICAgZXZlbnRzW2luZGV4XVsxXS5zdGFydCA9IGV2ZW50c1tpbmRleCAtIDJdWzFdLnN0YXJ0IC8vIEFkZCB0aGUgcHJlZml4IHN0YXJ0IHRvIHRoZSBIVE1MIGxpbmUgdG9rZW4uXG5cbiAgICBldmVudHNbaW5kZXggKyAxXVsxXS5zdGFydCA9IGV2ZW50c1tpbmRleCAtIDJdWzFdLnN0YXJ0IC8vIFJlbW92ZSB0aGUgbGluZSBwcmVmaXguXG5cbiAgICBldmVudHMuc3BsaWNlKGluZGV4IC0gMiwgMilcbiAgfVxuXG4gIHJldHVybiBldmVudHNcbn1cblxuZnVuY3Rpb24gdG9rZW5pemVIdG1sRmxvdyhlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICB2YXIga2luZFxuICB2YXIgc3RhcnRUYWdcbiAgdmFyIGJ1ZmZlclxuICB2YXIgaW5kZXhcbiAgdmFyIG1hcmtlclxuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgZWZmZWN0cy5lbnRlcignaHRtbEZsb3cnKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2h0bWxGbG93RGF0YScpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIG9wZW5cbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW4oY29kZSkge1xuICAgIGlmIChjb2RlID09PSAzMykge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gZGVjbGFyYXRpb25TdGFydFxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA0Nykge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gdGFnQ2xvc2VTdGFydFxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA2Mykge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBraW5kID0gMyAvLyBXaGlsZSB3ZeKAmXJlIGluIGFuIGluc3RydWN0aW9uIGluc3RlYWQgb2YgYSBkZWNsYXJhdGlvbiwgd2XigJlyZSBvbiBhIGA/YFxuICAgICAgLy8gcmlnaHQgbm93LCBzbyB3ZSBkbyBuZWVkIHRvIHNlYXJjaCBmb3IgYD5gLCBzaW1pbGFyIHRvIGRlY2xhcmF0aW9ucy5cblxuICAgICAgcmV0dXJuIHNlbGYuaW50ZXJydXB0ID8gb2sgOiBjb250aW51YXRpb25EZWNsYXJhdGlvbkluc2lkZVxuICAgIH1cblxuICAgIGlmIChhc2NpaUFscGhhKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGJ1ZmZlciA9IGZyb21DaGFyQ29kZShjb2RlKVxuICAgICAgc3RhcnRUYWcgPSB0cnVlXG4gICAgICByZXR1cm4gdGFnTmFtZVxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY2xhcmF0aW9uU3RhcnQoY29kZSkge1xuICAgIGlmIChjb2RlID09PSA0NSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBraW5kID0gMlxuICAgICAgcmV0dXJuIGNvbW1lbnRPcGVuSW5zaWRlXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IDkxKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGtpbmQgPSA1XG4gICAgICBidWZmZXIgPSAnQ0RBVEFbJ1xuICAgICAgaW5kZXggPSAwXG4gICAgICByZXR1cm4gY2RhdGFPcGVuSW5zaWRlXG4gICAgfVxuXG4gICAgaWYgKGFzY2lpQWxwaGEoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAga2luZCA9IDRcbiAgICAgIHJldHVybiBzZWxmLmludGVycnVwdCA/IG9rIDogY29udGludWF0aW9uRGVjbGFyYXRpb25JbnNpZGVcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb21tZW50T3Blbkluc2lkZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDQ1KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBzZWxmLmludGVycnVwdCA/IG9rIDogY29udGludWF0aW9uRGVjbGFyYXRpb25JbnNpZGVcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjZGF0YU9wZW5JbnNpZGUoY29kZSkge1xuICAgIGlmIChjb2RlID09PSBidWZmZXIuY2hhckNvZGVBdChpbmRleCsrKSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gaW5kZXggPT09IGJ1ZmZlci5sZW5ndGhcbiAgICAgICAgPyBzZWxmLmludGVycnVwdFxuICAgICAgICAgID8gb2tcbiAgICAgICAgICA6IGNvbnRpbnVhdGlvblxuICAgICAgICA6IGNkYXRhT3Blbkluc2lkZVxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZ0Nsb3NlU3RhcnQoY29kZSkge1xuICAgIGlmIChhc2NpaUFscGhhKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGJ1ZmZlciA9IGZyb21DaGFyQ29kZShjb2RlKVxuICAgICAgcmV0dXJuIHRhZ05hbWVcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiB0YWdOYW1lKGNvZGUpIHtcbiAgICBpZiAoXG4gICAgICBjb2RlID09PSBudWxsIHx8XG4gICAgICBjb2RlID09PSA0NyB8fFxuICAgICAgY29kZSA9PT0gNjIgfHxcbiAgICAgIG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UoY29kZSlcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgY29kZSAhPT0gNDcgJiZcbiAgICAgICAgc3RhcnRUYWcgJiZcbiAgICAgICAgaHRtbFJhd05hbWVzLmluZGV4T2YoYnVmZmVyLnRvTG93ZXJDYXNlKCkpID4gLTFcbiAgICAgICkge1xuICAgICAgICBraW5kID0gMVxuICAgICAgICByZXR1cm4gc2VsZi5pbnRlcnJ1cHQgPyBvayhjb2RlKSA6IGNvbnRpbnVhdGlvbihjb2RlKVxuICAgICAgfVxuXG4gICAgICBpZiAoaHRtbEJsb2NrTmFtZXMuaW5kZXhPZihidWZmZXIudG9Mb3dlckNhc2UoKSkgPiAtMSkge1xuICAgICAgICBraW5kID0gNlxuXG4gICAgICAgIGlmIChjb2RlID09PSA0Nykge1xuICAgICAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgICAgIHJldHVybiBiYXNpY1NlbGZDbG9zaW5nXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VsZi5pbnRlcnJ1cHQgPyBvayhjb2RlKSA6IGNvbnRpbnVhdGlvbihjb2RlKVxuICAgICAgfVxuXG4gICAgICBraW5kID0gNyAvLyBEbyBub3Qgc3VwcG9ydCBjb21wbGV0ZSBIVE1MIHdoZW4gaW50ZXJydXB0aW5nLlxuXG4gICAgICByZXR1cm4gc2VsZi5pbnRlcnJ1cHRcbiAgICAgICAgPyBub2soY29kZSlcbiAgICAgICAgOiBzdGFydFRhZ1xuICAgICAgICA/IGNvbXBsZXRlQXR0cmlidXRlTmFtZUJlZm9yZShjb2RlKVxuICAgICAgICA6IGNvbXBsZXRlQ2xvc2luZ1RhZ0FmdGVyKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IDQ1IHx8IGFzY2lpQWxwaGFudW1lcmljKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGJ1ZmZlciArPSBmcm9tQ2hhckNvZGUoY29kZSlcbiAgICAgIHJldHVybiB0YWdOYW1lXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gYmFzaWNTZWxmQ2xvc2luZyhjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDYyKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBzZWxmLmludGVycnVwdCA/IG9rIDogY29udGludWF0aW9uXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29tcGxldGVDbG9zaW5nVGFnQWZ0ZXIoY29kZSkge1xuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb21wbGV0ZUNsb3NpbmdUYWdBZnRlclxuICAgIH1cblxuICAgIHJldHVybiBjb21wbGV0ZUVuZChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29tcGxldGVBdHRyaWJ1dGVOYW1lQmVmb3JlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNDcpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNvbXBsZXRlRW5kXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IDU4IHx8IGNvZGUgPT09IDk1IHx8IGFzY2lpQWxwaGEoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNvbXBsZXRlQXR0cmlidXRlTmFtZVxuICAgIH1cblxuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb21wbGV0ZUF0dHJpYnV0ZU5hbWVCZWZvcmVcbiAgICB9XG5cbiAgICByZXR1cm4gY29tcGxldGVFbmQoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBsZXRlQXR0cmlidXRlTmFtZShjb2RlKSB7XG4gICAgaWYgKFxuICAgICAgY29kZSA9PT0gNDUgfHxcbiAgICAgIGNvZGUgPT09IDQ2IHx8XG4gICAgICBjb2RlID09PSA1OCB8fFxuICAgICAgY29kZSA9PT0gOTUgfHxcbiAgICAgIGFzY2lpQWxwaGFudW1lcmljKGNvZGUpXG4gICAgKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb21wbGV0ZUF0dHJpYnV0ZU5hbWVcbiAgICB9XG5cbiAgICByZXR1cm4gY29tcGxldGVBdHRyaWJ1dGVOYW1lQWZ0ZXIoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBsZXRlQXR0cmlidXRlTmFtZUFmdGVyKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNjEpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNvbXBsZXRlQXR0cmlidXRlVmFsdWVCZWZvcmVcbiAgICB9XG5cbiAgICBpZiAobWFya2Rvd25TcGFjZShjb2RlKSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29tcGxldGVBdHRyaWJ1dGVOYW1lQWZ0ZXJcbiAgICB9XG5cbiAgICByZXR1cm4gY29tcGxldGVBdHRyaWJ1dGVOYW1lQmVmb3JlKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb21wbGV0ZUF0dHJpYnV0ZVZhbHVlQmVmb3JlKGNvZGUpIHtcbiAgICBpZiAoXG4gICAgICBjb2RlID09PSBudWxsIHx8XG4gICAgICBjb2RlID09PSA2MCB8fFxuICAgICAgY29kZSA9PT0gNjEgfHxcbiAgICAgIGNvZGUgPT09IDYyIHx8XG4gICAgICBjb2RlID09PSA5NlxuICAgICkge1xuICAgICAgcmV0dXJuIG5vayhjb2RlKVxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSAzNCB8fCBjb2RlID09PSAzOSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBtYXJrZXIgPSBjb2RlXG4gICAgICByZXR1cm4gY29tcGxldGVBdHRyaWJ1dGVWYWx1ZVF1b3RlZFxuICAgIH1cblxuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb21wbGV0ZUF0dHJpYnV0ZVZhbHVlQmVmb3JlXG4gICAgfVxuXG4gICAgbWFya2VyID0gdW5kZWZpbmVkXG4gICAgcmV0dXJuIGNvbXBsZXRlQXR0cmlidXRlVmFsdWVVbnF1b3RlZChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29tcGxldGVBdHRyaWJ1dGVWYWx1ZVF1b3RlZChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG1hcmtlcikge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29tcGxldGVBdHRyaWJ1dGVWYWx1ZVF1b3RlZEFmdGVyXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICByZXR1cm4gbm9rKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIGNvbXBsZXRlQXR0cmlidXRlVmFsdWVRdW90ZWRcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBsZXRlQXR0cmlidXRlVmFsdWVVbnF1b3RlZChjb2RlKSB7XG4gICAgaWYgKFxuICAgICAgY29kZSA9PT0gbnVsbCB8fFxuICAgICAgY29kZSA9PT0gMzQgfHxcbiAgICAgIGNvZGUgPT09IDM5IHx8XG4gICAgICBjb2RlID09PSA2MCB8fFxuICAgICAgY29kZSA9PT0gNjEgfHxcbiAgICAgIGNvZGUgPT09IDYyIHx8XG4gICAgICBjb2RlID09PSA5NiB8fFxuICAgICAgbWFya2Rvd25MaW5lRW5kaW5nT3JTcGFjZShjb2RlKVxuICAgICkge1xuICAgICAgcmV0dXJuIGNvbXBsZXRlQXR0cmlidXRlTmFtZUFmdGVyKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIGNvbXBsZXRlQXR0cmlidXRlVmFsdWVVbnF1b3RlZFxuICB9XG5cbiAgZnVuY3Rpb24gY29tcGxldGVBdHRyaWJ1dGVWYWx1ZVF1b3RlZEFmdGVyKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNDcgfHwgY29kZSA9PT0gNjIgfHwgbWFya2Rvd25TcGFjZShjb2RlKSkge1xuICAgICAgcmV0dXJuIGNvbXBsZXRlQXR0cmlidXRlTmFtZUJlZm9yZShjb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBsZXRlRW5kKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNjIpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNvbXBsZXRlQWZ0ZXJcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb21wbGV0ZUFmdGVyKGNvZGUpIHtcbiAgICBpZiAobWFya2Rvd25TcGFjZShjb2RlKSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29tcGxldGVBZnRlclxuICAgIH1cblxuICAgIHJldHVybiBjb2RlID09PSBudWxsIHx8IG1hcmtkb3duTGluZUVuZGluZyhjb2RlKVxuICAgICAgPyBjb250aW51YXRpb24oY29kZSlcbiAgICAgIDogbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb250aW51YXRpb24oY29kZSkge1xuICAgIGlmIChjb2RlID09PSA0NSAmJiBraW5kID09PSAyKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb250aW51YXRpb25Db21tZW50SW5zaWRlXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IDYwICYmIGtpbmQgPT09IDEpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNvbnRpbnVhdGlvblJhd1RhZ09wZW5cbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gNjIgJiYga2luZCA9PT0gNCkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29udGludWF0aW9uQ2xvc2VcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gNjMgJiYga2luZCA9PT0gMykge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29udGludWF0aW9uRGVjbGFyYXRpb25JbnNpZGVcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gOTMgJiYga2luZCA9PT0gNSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29udGludWF0aW9uQ2hhcmFjdGVyRGF0YUluc2lkZVxuICAgIH1cblxuICAgIGlmIChtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkgJiYgKGtpbmQgPT09IDYgfHwga2luZCA9PT0gNykpIHtcbiAgICAgIHJldHVybiBlZmZlY3RzLmNoZWNrKFxuICAgICAgICBuZXh0QmxhbmtDb25zdHJ1Y3QsXG4gICAgICAgIGNvbnRpbnVhdGlvbkNsb3NlLFxuICAgICAgICBjb250aW51YXRpb25BdExpbmVFbmRpbmdcbiAgICAgICkoY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIHJldHVybiBjb250aW51YXRpb25BdExpbmVFbmRpbmcoY29kZSlcbiAgICB9XG5cbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICByZXR1cm4gY29udGludWF0aW9uXG4gIH1cblxuICBmdW5jdGlvbiBjb250aW51YXRpb25BdExpbmVFbmRpbmcoY29kZSkge1xuICAgIGVmZmVjdHMuZXhpdCgnaHRtbEZsb3dEYXRhJylcbiAgICByZXR1cm4gaHRtbENvbnRpbnVlU3RhcnQoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGh0bWxDb250aW51ZVN0YXJ0KGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGRvbmUoY29kZSlcbiAgICB9XG5cbiAgICBpZiAobWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdsaW5lRW5kaW5nJylcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgZWZmZWN0cy5leGl0KCdsaW5lRW5kaW5nJylcbiAgICAgIHJldHVybiBodG1sQ29udGludWVTdGFydFxuICAgIH1cblxuICAgIGVmZmVjdHMuZW50ZXIoJ2h0bWxGbG93RGF0YScpXG4gICAgcmV0dXJuIGNvbnRpbnVhdGlvbihjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29udGludWF0aW9uQ29tbWVudEluc2lkZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDQ1KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb250aW51YXRpb25EZWNsYXJhdGlvbkluc2lkZVxuICAgIH1cblxuICAgIHJldHVybiBjb250aW51YXRpb24oY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnRpbnVhdGlvblJhd1RhZ09wZW4oY29kZSkge1xuICAgIGlmIChjb2RlID09PSA0Nykge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBidWZmZXIgPSAnJ1xuICAgICAgcmV0dXJuIGNvbnRpbnVhdGlvblJhd0VuZFRhZ1xuICAgIH1cblxuICAgIHJldHVybiBjb250aW51YXRpb24oY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnRpbnVhdGlvblJhd0VuZFRhZyhjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDYyICYmIGh0bWxSYXdOYW1lcy5pbmRleE9mKGJ1ZmZlci50b0xvd2VyQ2FzZSgpKSA+IC0xKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb250aW51YXRpb25DbG9zZVxuICAgIH1cblxuICAgIGlmIChhc2NpaUFscGhhKGNvZGUpICYmIGJ1ZmZlci5sZW5ndGggPCA4KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGJ1ZmZlciArPSBmcm9tQ2hhckNvZGUoY29kZSlcbiAgICAgIHJldHVybiBjb250aW51YXRpb25SYXdFbmRUYWdcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGludWF0aW9uKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb250aW51YXRpb25DaGFyYWN0ZXJEYXRhSW5zaWRlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gOTMpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNvbnRpbnVhdGlvbkRlY2xhcmF0aW9uSW5zaWRlXG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRpbnVhdGlvbihjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29udGludWF0aW9uRGVjbGFyYXRpb25JbnNpZGUoY29kZSkge1xuICAgIGlmIChjb2RlID09PSA2Mikge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29udGludWF0aW9uQ2xvc2VcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGludWF0aW9uKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb250aW51YXRpb25DbG9zZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ2h0bWxGbG93RGF0YScpXG4gICAgICByZXR1cm4gZG9uZShjb2RlKVxuICAgIH1cblxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIHJldHVybiBjb250aW51YXRpb25DbG9zZVxuICB9XG5cbiAgZnVuY3Rpb24gZG9uZShjb2RlKSB7XG4gICAgZWZmZWN0cy5leGl0KCdodG1sRmxvdycpXG4gICAgcmV0dXJuIG9rKGNvZGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gdG9rZW5pemVOZXh0QmxhbmsoZWZmZWN0cywgb2ssIG5vaykge1xuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgZWZmZWN0cy5leGl0KCdodG1sRmxvd0RhdGEnKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2xpbmVFbmRpbmdCbGFuaycpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgZWZmZWN0cy5leGl0KCdsaW5lRW5kaW5nQmxhbmsnKVxuICAgIHJldHVybiBlZmZlY3RzLmF0dGVtcHQocGFydGlhbEJsYW5rTGluZSwgb2ssIG5vaylcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGh0bWxGbG93XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGFzY2lpQWxwaGEgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvYXNjaWktYWxwaGEuanMnKVxudmFyIGFzY2lpQWxwaGFudW1lcmljID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL2FzY2lpLWFscGhhbnVtZXJpYy5qcycpXG52YXIgbWFya2Rvd25MaW5lRW5kaW5nID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLWxpbmUtZW5kaW5nLmpzJylcbnZhciBtYXJrZG93bkxpbmVFbmRpbmdPclNwYWNlID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLWxpbmUtZW5kaW5nLW9yLXNwYWNlLmpzJylcbnZhciBtYXJrZG93blNwYWNlID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLXNwYWNlLmpzJylcbnZhciBmYWN0b3J5U3BhY2UgPSByZXF1aXJlKCcuL2ZhY3Rvcnktc3BhY2UuanMnKVxuXG52YXIgaHRtbFRleHQgPSB7XG4gIG5hbWU6ICdodG1sVGV4dCcsXG4gIHRva2VuaXplOiB0b2tlbml6ZUh0bWxUZXh0XG59XG5cbmZ1bmN0aW9uIHRva2VuaXplSHRtbFRleHQoZWZmZWN0cywgb2ssIG5vaykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgdmFyIG1hcmtlclxuICB2YXIgYnVmZmVyXG4gIHZhciBpbmRleFxuICB2YXIgcmV0dXJuU3RhdGVcbiAgcmV0dXJuIHN0YXJ0XG5cbiAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgIGVmZmVjdHMuZW50ZXIoJ2h0bWxUZXh0JylcbiAgICBlZmZlY3RzLmVudGVyKCdodG1sVGV4dERhdGEnKVxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIHJldHVybiBvcGVuXG4gIH1cblxuICBmdW5jdGlvbiBvcGVuKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gMzMpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGRlY2xhcmF0aW9uT3BlblxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA0Nykge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gdGFnQ2xvc2VTdGFydFxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA2Mykge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gaW5zdHJ1Y3Rpb25cbiAgICB9XG5cbiAgICBpZiAoYXNjaWlBbHBoYShjb2RlKSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gdGFnT3BlblxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY2xhcmF0aW9uT3Blbihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDQ1KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjb21tZW50T3BlblxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA5MSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBidWZmZXIgPSAnQ0RBVEFbJ1xuICAgICAgaW5kZXggPSAwXG4gICAgICByZXR1cm4gY2RhdGFPcGVuXG4gICAgfVxuXG4gICAgaWYgKGFzY2lpQWxwaGEoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGRlY2xhcmF0aW9uXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29tbWVudE9wZW4oY29kZSkge1xuICAgIGlmIChjb2RlID09PSA0NSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29tbWVudFN0YXJ0XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY29tbWVudFN0YXJ0KGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBjb2RlID09PSA2Mikge1xuICAgICAgcmV0dXJuIG5vayhjb2RlKVxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA0NSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29tbWVudFN0YXJ0RGFzaFxuICAgIH1cblxuICAgIHJldHVybiBjb21tZW50KGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb21tZW50U3RhcnREYXNoKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCB8fCBjb2RlID09PSA2Mikge1xuICAgICAgcmV0dXJuIG5vayhjb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBjb21tZW50KGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjb21tZW50KGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG5vayhjb2RlKVxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSA0NSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gY29tbWVudENsb3NlXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgcmV0dXJuU3RhdGUgPSBjb21tZW50XG4gICAgICByZXR1cm4gYXRMaW5lRW5kaW5nKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIGNvbW1lbnRcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbW1lbnRDbG9zZShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDQ1KSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBlbmRcbiAgICB9XG5cbiAgICByZXR1cm4gY29tbWVudChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gY2RhdGFPcGVuKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gYnVmZmVyLmNoYXJDb2RlQXQoaW5kZXgrKykpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGluZGV4ID09PSBidWZmZXIubGVuZ3RoID8gY2RhdGEgOiBjZGF0YU9wZW5cbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjZGF0YShjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gOTMpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNkYXRhQ2xvc2VcbiAgICB9XG5cbiAgICBpZiAobWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICByZXR1cm5TdGF0ZSA9IGNkYXRhXG4gICAgICByZXR1cm4gYXRMaW5lRW5kaW5nKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIGNkYXRhXG4gIH1cblxuICBmdW5jdGlvbiBjZGF0YUNsb3NlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gOTMpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNkYXRhRW5kXG4gICAgfVxuXG4gICAgcmV0dXJuIGNkYXRhKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjZGF0YUVuZChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDYyKSB7XG4gICAgICByZXR1cm4gZW5kKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IDkzKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBjZGF0YUVuZFxuICAgIH1cblxuICAgIHJldHVybiBjZGF0YShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjbGFyYXRpb24oY29kZSkge1xuICAgIGlmIChjb2RlID09PSBudWxsIHx8IGNvZGUgPT09IDYyKSB7XG4gICAgICByZXR1cm4gZW5kKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgcmV0dXJuU3RhdGUgPSBkZWNsYXJhdGlvblxuICAgICAgcmV0dXJuIGF0TGluZUVuZGluZyhjb2RlKVxuICAgIH1cblxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIHJldHVybiBkZWNsYXJhdGlvblxuICB9XG5cbiAgZnVuY3Rpb24gaW5zdHJ1Y3Rpb24oY29kZSkge1xuICAgIGlmIChjb2RlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbm9rKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IDYzKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBpbnN0cnVjdGlvbkNsb3NlXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgcmV0dXJuU3RhdGUgPSBpbnN0cnVjdGlvblxuICAgICAgcmV0dXJuIGF0TGluZUVuZGluZyhjb2RlKVxuICAgIH1cblxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIHJldHVybiBpbnN0cnVjdGlvblxuICB9XG5cbiAgZnVuY3Rpb24gaW5zdHJ1Y3Rpb25DbG9zZShjb2RlKSB7XG4gICAgcmV0dXJuIGNvZGUgPT09IDYyID8gZW5kKGNvZGUpIDogaW5zdHJ1Y3Rpb24oY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZ0Nsb3NlU3RhcnQoY29kZSkge1xuICAgIGlmIChhc2NpaUFscGhhKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiB0YWdDbG9zZVxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZ0Nsb3NlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNDUgfHwgYXNjaWlBbHBoYW51bWVyaWMoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIHRhZ0Nsb3NlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRhZ0Nsb3NlQmV0d2Vlbihjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gdGFnQ2xvc2VCZXR3ZWVuKGNvZGUpIHtcbiAgICBpZiAobWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICByZXR1cm5TdGF0ZSA9IHRhZ0Nsb3NlQmV0d2VlblxuICAgICAgcmV0dXJuIGF0TGluZUVuZGluZyhjb2RlKVxuICAgIH1cblxuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiB0YWdDbG9zZUJldHdlZW5cbiAgICB9XG5cbiAgICByZXR1cm4gZW5kKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiB0YWdPcGVuKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gNDUgfHwgYXNjaWlBbHBoYW51bWVyaWMoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIHRhZ09wZW5cbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gNDcgfHwgY29kZSA9PT0gNjIgfHwgbWFya2Rvd25MaW5lRW5kaW5nT3JTcGFjZShjb2RlKSkge1xuICAgICAgcmV0dXJuIHRhZ09wZW5CZXR3ZWVuKGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5vayhjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gdGFnT3BlbkJldHdlZW4oY29kZSkge1xuICAgIGlmIChjb2RlID09PSA0Nykge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gZW5kXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IDU4IHx8IGNvZGUgPT09IDk1IHx8IGFzY2lpQWxwaGEoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIHRhZ09wZW5BdHRyaWJ1dGVOYW1lXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgcmV0dXJuU3RhdGUgPSB0YWdPcGVuQmV0d2VlblxuICAgICAgcmV0dXJuIGF0TGluZUVuZGluZyhjb2RlKVxuICAgIH1cblxuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiB0YWdPcGVuQmV0d2VlblxuICAgIH1cblxuICAgIHJldHVybiBlbmQoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZ09wZW5BdHRyaWJ1dGVOYW1lKGNvZGUpIHtcbiAgICBpZiAoXG4gICAgICBjb2RlID09PSA0NSB8fFxuICAgICAgY29kZSA9PT0gNDYgfHxcbiAgICAgIGNvZGUgPT09IDU4IHx8XG4gICAgICBjb2RlID09PSA5NSB8fFxuICAgICAgYXNjaWlBbHBoYW51bWVyaWMoY29kZSlcbiAgICApIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIHRhZ09wZW5BdHRyaWJ1dGVOYW1lXG4gICAgfVxuXG4gICAgcmV0dXJuIHRhZ09wZW5BdHRyaWJ1dGVOYW1lQWZ0ZXIoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZ09wZW5BdHRyaWJ1dGVOYW1lQWZ0ZXIoY29kZSkge1xuICAgIGlmIChjb2RlID09PSA2MSkge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICByZXR1cm4gdGFnT3BlbkF0dHJpYnV0ZVZhbHVlQmVmb3JlXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgcmV0dXJuU3RhdGUgPSB0YWdPcGVuQXR0cmlidXRlTmFtZUFmdGVyXG4gICAgICByZXR1cm4gYXRMaW5lRW5kaW5nKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duU3BhY2UoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIHRhZ09wZW5BdHRyaWJ1dGVOYW1lQWZ0ZXJcbiAgICB9XG5cbiAgICByZXR1cm4gdGFnT3BlbkJldHdlZW4oY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZ09wZW5BdHRyaWJ1dGVWYWx1ZUJlZm9yZShjb2RlKSB7XG4gICAgaWYgKFxuICAgICAgY29kZSA9PT0gbnVsbCB8fFxuICAgICAgY29kZSA9PT0gNjAgfHxcbiAgICAgIGNvZGUgPT09IDYxIHx8XG4gICAgICBjb2RlID09PSA2MiB8fFxuICAgICAgY29kZSA9PT0gOTZcbiAgICApIHtcbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gMzQgfHwgY29kZSA9PT0gMzkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgbWFya2VyID0gY29kZVxuICAgICAgcmV0dXJuIHRhZ09wZW5BdHRyaWJ1dGVWYWx1ZVF1b3RlZFxuICAgIH1cblxuICAgIGlmIChtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIHJldHVyblN0YXRlID0gdGFnT3BlbkF0dHJpYnV0ZVZhbHVlQmVmb3JlXG4gICAgICByZXR1cm4gYXRMaW5lRW5kaW5nKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duU3BhY2UoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIHRhZ09wZW5BdHRyaWJ1dGVWYWx1ZUJlZm9yZVxuICAgIH1cblxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIG1hcmtlciA9IHVuZGVmaW5lZFxuICAgIHJldHVybiB0YWdPcGVuQXR0cmlidXRlVmFsdWVVbnF1b3RlZFxuICB9XG5cbiAgZnVuY3Rpb24gdGFnT3BlbkF0dHJpYnV0ZVZhbHVlUXVvdGVkKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbWFya2VyKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiB0YWdPcGVuQXR0cmlidXRlVmFsdWVRdW90ZWRBZnRlclxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbm9rKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKG1hcmtkb3duTGluZUVuZGluZyhjb2RlKSkge1xuICAgICAgcmV0dXJuU3RhdGUgPSB0YWdPcGVuQXR0cmlidXRlVmFsdWVRdW90ZWRcbiAgICAgIHJldHVybiBhdExpbmVFbmRpbmcoY29kZSlcbiAgICB9XG5cbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICByZXR1cm4gdGFnT3BlbkF0dHJpYnV0ZVZhbHVlUXVvdGVkXG4gIH1cblxuICBmdW5jdGlvbiB0YWdPcGVuQXR0cmlidXRlVmFsdWVRdW90ZWRBZnRlcihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDYyIHx8IGNvZGUgPT09IDQ3IHx8IG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UoY29kZSkpIHtcbiAgICAgIHJldHVybiB0YWdPcGVuQmV0d2Vlbihjb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZ09wZW5BdHRyaWJ1dGVWYWx1ZVVucXVvdGVkKGNvZGUpIHtcbiAgICBpZiAoXG4gICAgICBjb2RlID09PSBudWxsIHx8XG4gICAgICBjb2RlID09PSAzNCB8fFxuICAgICAgY29kZSA9PT0gMzkgfHxcbiAgICAgIGNvZGUgPT09IDYwIHx8XG4gICAgICBjb2RlID09PSA2MSB8fFxuICAgICAgY29kZSA9PT0gOTZcbiAgICApIHtcbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gNjIgfHwgbWFya2Rvd25MaW5lRW5kaW5nT3JTcGFjZShjb2RlKSkge1xuICAgICAgcmV0dXJuIHRhZ09wZW5CZXR3ZWVuKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIHRhZ09wZW5BdHRyaWJ1dGVWYWx1ZVVucXVvdGVkXG4gIH0gLy8gV2UgY2Fu4oCZdCBoYXZlIGJsYW5rIGxpbmVzIGluIGNvbnRlbnQsIHNvIG5vIG5lZWQgdG8gd29ycnkgYWJvdXQgZW1wdHlcbiAgLy8gdG9rZW5zLlxuXG4gIGZ1bmN0aW9uIGF0TGluZUVuZGluZyhjb2RlKSB7XG4gICAgZWZmZWN0cy5leGl0KCdodG1sVGV4dERhdGEnKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2xpbmVFbmRpbmcnKVxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIGVmZmVjdHMuZXhpdCgnbGluZUVuZGluZycpXG4gICAgcmV0dXJuIGZhY3RvcnlTcGFjZShcbiAgICAgIGVmZmVjdHMsXG4gICAgICBhZnRlclByZWZpeCxcbiAgICAgICdsaW5lUHJlZml4JyxcbiAgICAgIHNlbGYucGFyc2VyLmNvbnN0cnVjdHMuZGlzYWJsZS5udWxsLmluZGV4T2YoJ2NvZGVJbmRlbnRlZCcpID4gLTFcbiAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgOiA0XG4gICAgKVxuICB9XG5cbiAgZnVuY3Rpb24gYWZ0ZXJQcmVmaXgoY29kZSkge1xuICAgIGVmZmVjdHMuZW50ZXIoJ2h0bWxUZXh0RGF0YScpXG4gICAgcmV0dXJuIHJldHVyblN0YXRlKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBlbmQoY29kZSkge1xuICAgIGlmIChjb2RlID09PSA2Mikge1xuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2h0bWxUZXh0RGF0YScpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2h0bWxUZXh0JylcbiAgICAgIHJldHVybiBva1xuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGh0bWxUZXh0XG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tbGluZS1lbmRpbmctb3Itc3BhY2UuanMnKVxudmFyIGNodW5rZWRQdXNoID0gcmVxdWlyZSgnLi4vdXRpbC9jaHVua2VkLXB1c2guanMnKVxudmFyIGNodW5rZWRTcGxpY2UgPSByZXF1aXJlKCcuLi91dGlsL2NodW5rZWQtc3BsaWNlLmpzJylcbnZhciBub3JtYWxpemVJZGVudGlmaWVyID0gcmVxdWlyZSgnLi4vdXRpbC9ub3JtYWxpemUtaWRlbnRpZmllci5qcycpXG52YXIgcmVzb2x2ZUFsbCA9IHJlcXVpcmUoJy4uL3V0aWwvcmVzb2x2ZS1hbGwuanMnKVxudmFyIHNoYWxsb3cgPSByZXF1aXJlKCcuLi91dGlsL3NoYWxsb3cuanMnKVxudmFyIGZhY3RvcnlEZXN0aW5hdGlvbiA9IHJlcXVpcmUoJy4vZmFjdG9yeS1kZXN0aW5hdGlvbi5qcycpXG52YXIgZmFjdG9yeUxhYmVsID0gcmVxdWlyZSgnLi9mYWN0b3J5LWxhYmVsLmpzJylcbnZhciBmYWN0b3J5VGl0bGUgPSByZXF1aXJlKCcuL2ZhY3RvcnktdGl0bGUuanMnKVxudmFyIGZhY3RvcnlXaGl0ZXNwYWNlID0gcmVxdWlyZSgnLi9mYWN0b3J5LXdoaXRlc3BhY2UuanMnKVxuXG52YXIgbGFiZWxFbmQgPSB7XG4gIG5hbWU6ICdsYWJlbEVuZCcsXG4gIHRva2VuaXplOiB0b2tlbml6ZUxhYmVsRW5kLFxuICByZXNvbHZlVG86IHJlc29sdmVUb0xhYmVsRW5kLFxuICByZXNvbHZlQWxsOiByZXNvbHZlQWxsTGFiZWxFbmRcbn1cbnZhciByZXNvdXJjZUNvbnN0cnVjdCA9IHtcbiAgdG9rZW5pemU6IHRva2VuaXplUmVzb3VyY2Vcbn1cbnZhciBmdWxsUmVmZXJlbmNlQ29uc3RydWN0ID0ge1xuICB0b2tlbml6ZTogdG9rZW5pemVGdWxsUmVmZXJlbmNlXG59XG52YXIgY29sbGFwc2VkUmVmZXJlbmNlQ29uc3RydWN0ID0ge1xuICB0b2tlbml6ZTogdG9rZW5pemVDb2xsYXBzZWRSZWZlcmVuY2Vcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUFsbExhYmVsRW5kKGV2ZW50cykge1xuICB2YXIgaW5kZXggPSAtMVxuICB2YXIgdG9rZW5cblxuICB3aGlsZSAoKytpbmRleCA8IGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0b2tlbiA9IGV2ZW50c1tpbmRleF1bMV1cblxuICAgIGlmIChcbiAgICAgICF0b2tlbi5fdXNlZCAmJlxuICAgICAgKHRva2VuLnR5cGUgPT09ICdsYWJlbEltYWdlJyB8fFxuICAgICAgICB0b2tlbi50eXBlID09PSAnbGFiZWxMaW5rJyB8fFxuICAgICAgICB0b2tlbi50eXBlID09PSAnbGFiZWxFbmQnKVxuICAgICkge1xuICAgICAgLy8gUmVtb3ZlIHRoZSBtYXJrZXIuXG4gICAgICBldmVudHMuc3BsaWNlKGluZGV4ICsgMSwgdG9rZW4udHlwZSA9PT0gJ2xhYmVsSW1hZ2UnID8gNCA6IDIpXG4gICAgICB0b2tlbi50eXBlID0gJ2RhdGEnXG4gICAgICBpbmRleCsrXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGV2ZW50c1xufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9MYWJlbEVuZChldmVudHMsIGNvbnRleHQpIHtcbiAgdmFyIGluZGV4ID0gZXZlbnRzLmxlbmd0aFxuICB2YXIgb2Zmc2V0ID0gMFxuICB2YXIgZ3JvdXBcbiAgdmFyIGxhYmVsXG4gIHZhciB0ZXh0XG4gIHZhciB0b2tlblxuICB2YXIgb3BlblxuICB2YXIgY2xvc2VcbiAgdmFyIG1lZGlhIC8vIEZpbmQgYW4gb3BlbmluZy5cblxuICB3aGlsZSAoaW5kZXgtLSkge1xuICAgIHRva2VuID0gZXZlbnRzW2luZGV4XVsxXVxuXG4gICAgaWYgKG9wZW4pIHtcbiAgICAgIC8vIElmIHdlIHNlZSBhbm90aGVyIGxpbmssIG9yIGluYWN0aXZlIGxpbmsgbGFiZWwsIHdl4oCZdmUgYmVlbiBoZXJlIGJlZm9yZS5cbiAgICAgIGlmIChcbiAgICAgICAgdG9rZW4udHlwZSA9PT0gJ2xpbmsnIHx8XG4gICAgICAgICh0b2tlbi50eXBlID09PSAnbGFiZWxMaW5rJyAmJiB0b2tlbi5faW5hY3RpdmUpXG4gICAgICApIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH0gLy8gTWFyayBvdGhlciBsaW5rIG9wZW5pbmdzIGFzIGluYWN0aXZlLCBhcyB3ZSBjYW7igJl0IGhhdmUgbGlua3MgaW5cbiAgICAgIC8vIGxpbmtzLlxuXG4gICAgICBpZiAoZXZlbnRzW2luZGV4XVswXSA9PT0gJ2VudGVyJyAmJiB0b2tlbi50eXBlID09PSAnbGFiZWxMaW5rJykge1xuICAgICAgICB0b2tlbi5faW5hY3RpdmUgPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjbG9zZSkge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudHNbaW5kZXhdWzBdID09PSAnZW50ZXInICYmXG4gICAgICAgICh0b2tlbi50eXBlID09PSAnbGFiZWxJbWFnZScgfHwgdG9rZW4udHlwZSA9PT0gJ2xhYmVsTGluaycpICYmXG4gICAgICAgICF0b2tlbi5fYmFsYW5jZWRcbiAgICAgICkge1xuICAgICAgICBvcGVuID0gaW5kZXhcblxuICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gJ2xhYmVsTGluaycpIHtcbiAgICAgICAgICBvZmZzZXQgPSAyXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodG9rZW4udHlwZSA9PT0gJ2xhYmVsRW5kJykge1xuICAgICAgY2xvc2UgPSBpbmRleFxuICAgIH1cbiAgfVxuXG4gIGdyb3VwID0ge1xuICAgIHR5cGU6IGV2ZW50c1tvcGVuXVsxXS50eXBlID09PSAnbGFiZWxMaW5rJyA/ICdsaW5rJyA6ICdpbWFnZScsXG4gICAgc3RhcnQ6IHNoYWxsb3coZXZlbnRzW29wZW5dWzFdLnN0YXJ0KSxcbiAgICBlbmQ6IHNoYWxsb3coZXZlbnRzW2V2ZW50cy5sZW5ndGggLSAxXVsxXS5lbmQpXG4gIH1cbiAgbGFiZWwgPSB7XG4gICAgdHlwZTogJ2xhYmVsJyxcbiAgICBzdGFydDogc2hhbGxvdyhldmVudHNbb3Blbl1bMV0uc3RhcnQpLFxuICAgIGVuZDogc2hhbGxvdyhldmVudHNbY2xvc2VdWzFdLmVuZClcbiAgfVxuICB0ZXh0ID0ge1xuICAgIHR5cGU6ICdsYWJlbFRleHQnLFxuICAgIHN0YXJ0OiBzaGFsbG93KGV2ZW50c1tvcGVuICsgb2Zmc2V0ICsgMl1bMV0uZW5kKSxcbiAgICBlbmQ6IHNoYWxsb3coZXZlbnRzW2Nsb3NlIC0gMl1bMV0uc3RhcnQpXG4gIH1cbiAgbWVkaWEgPSBbXG4gICAgWydlbnRlcicsIGdyb3VwLCBjb250ZXh0XSxcbiAgICBbJ2VudGVyJywgbGFiZWwsIGNvbnRleHRdXG4gIF0gLy8gT3BlbmluZyBtYXJrZXIuXG5cbiAgbWVkaWEgPSBjaHVua2VkUHVzaChtZWRpYSwgZXZlbnRzLnNsaWNlKG9wZW4gKyAxLCBvcGVuICsgb2Zmc2V0ICsgMykpIC8vIFRleHQgb3Blbi5cblxuICBtZWRpYSA9IGNodW5rZWRQdXNoKG1lZGlhLCBbWydlbnRlcicsIHRleHQsIGNvbnRleHRdXSkgLy8gQmV0d2Vlbi5cblxuICBtZWRpYSA9IGNodW5rZWRQdXNoKFxuICAgIG1lZGlhLFxuICAgIHJlc29sdmVBbGwoXG4gICAgICBjb250ZXh0LnBhcnNlci5jb25zdHJ1Y3RzLmluc2lkZVNwYW4ubnVsbCxcbiAgICAgIGV2ZW50cy5zbGljZShvcGVuICsgb2Zmc2V0ICsgNCwgY2xvc2UgLSAzKSxcbiAgICAgIGNvbnRleHRcbiAgICApXG4gICkgLy8gVGV4dCBjbG9zZSwgbWFya2VyIGNsb3NlLCBsYWJlbCBjbG9zZS5cblxuICBtZWRpYSA9IGNodW5rZWRQdXNoKG1lZGlhLCBbXG4gICAgWydleGl0JywgdGV4dCwgY29udGV4dF0sXG4gICAgZXZlbnRzW2Nsb3NlIC0gMl0sXG4gICAgZXZlbnRzW2Nsb3NlIC0gMV0sXG4gICAgWydleGl0JywgbGFiZWwsIGNvbnRleHRdXG4gIF0pIC8vIFJlZmVyZW5jZSwgcmVzb3VyY2UsIG9yIHNvLlxuXG4gIG1lZGlhID0gY2h1bmtlZFB1c2gobWVkaWEsIGV2ZW50cy5zbGljZShjbG9zZSArIDEpKSAvLyBNZWRpYSBjbG9zZS5cblxuICBtZWRpYSA9IGNodW5rZWRQdXNoKG1lZGlhLCBbWydleGl0JywgZ3JvdXAsIGNvbnRleHRdXSlcbiAgY2h1bmtlZFNwbGljZShldmVudHMsIG9wZW4sIGV2ZW50cy5sZW5ndGgsIG1lZGlhKVxuICByZXR1cm4gZXZlbnRzXG59XG5cbmZ1bmN0aW9uIHRva2VuaXplTGFiZWxFbmQoZWZmZWN0cywgb2ssIG5vaykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgdmFyIGluZGV4ID0gc2VsZi5ldmVudHMubGVuZ3RoXG4gIHZhciBsYWJlbFN0YXJ0XG4gIHZhciBkZWZpbmVkIC8vIEZpbmQgYW4gb3BlbmluZy5cblxuICB3aGlsZSAoaW5kZXgtLSkge1xuICAgIGlmIChcbiAgICAgIChzZWxmLmV2ZW50c1tpbmRleF1bMV0udHlwZSA9PT0gJ2xhYmVsSW1hZ2UnIHx8XG4gICAgICAgIHNlbGYuZXZlbnRzW2luZGV4XVsxXS50eXBlID09PSAnbGFiZWxMaW5rJykgJiZcbiAgICAgICFzZWxmLmV2ZW50c1tpbmRleF1bMV0uX2JhbGFuY2VkXG4gICAgKSB7XG4gICAgICBsYWJlbFN0YXJ0ID0gc2VsZi5ldmVudHNbaW5kZXhdWzFdXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBpZiAoIWxhYmVsU3RhcnQpIHtcbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9IC8vIEl04oCZcyBhIGJhbGFuY2VkIGJyYWNrZXQsIGJ1dCBjb250YWlucyBhIGxpbmsuXG5cbiAgICBpZiAobGFiZWxTdGFydC5faW5hY3RpdmUpIHJldHVybiBiYWxhbmNlZChjb2RlKVxuICAgIGRlZmluZWQgPVxuICAgICAgc2VsZi5wYXJzZXIuZGVmaW5lZC5pbmRleE9mKFxuICAgICAgICBub3JtYWxpemVJZGVudGlmaWVyKFxuICAgICAgICAgIHNlbGYuc2xpY2VTZXJpYWxpemUoe1xuICAgICAgICAgICAgc3RhcnQ6IGxhYmVsU3RhcnQuZW5kLFxuICAgICAgICAgICAgZW5kOiBzZWxmLm5vdygpXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKSA+IC0xXG4gICAgZWZmZWN0cy5lbnRlcignbGFiZWxFbmQnKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2xhYmVsTWFya2VyJylcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQoJ2xhYmVsTWFya2VyJylcbiAgICBlZmZlY3RzLmV4aXQoJ2xhYmVsRW5kJylcbiAgICByZXR1cm4gYWZ0ZXJMYWJlbEVuZFxuICB9XG5cbiAgZnVuY3Rpb24gYWZ0ZXJMYWJlbEVuZChjb2RlKSB7XG4gICAgLy8gUmVzb3VyY2U6IGBbYXNkXShmZ2gpYC5cbiAgICBpZiAoY29kZSA9PT0gNDApIHtcbiAgICAgIHJldHVybiBlZmZlY3RzLmF0dGVtcHQoXG4gICAgICAgIHJlc291cmNlQ29uc3RydWN0LFxuICAgICAgICBvayxcbiAgICAgICAgZGVmaW5lZCA/IG9rIDogYmFsYW5jZWRcbiAgICAgICkoY29kZSlcbiAgICB9IC8vIENvbGxhcHNlZCAoYFthc2RdW11gKSBvciBmdWxsIChgW2FzZF1bZmdoXWApIHJlZmVyZW5jZT9cblxuICAgIGlmIChjb2RlID09PSA5MSkge1xuICAgICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChcbiAgICAgICAgZnVsbFJlZmVyZW5jZUNvbnN0cnVjdCxcbiAgICAgICAgb2ssXG4gICAgICAgIGRlZmluZWRcbiAgICAgICAgICA/IGVmZmVjdHMuYXR0ZW1wdChjb2xsYXBzZWRSZWZlcmVuY2VDb25zdHJ1Y3QsIG9rLCBiYWxhbmNlZClcbiAgICAgICAgICA6IGJhbGFuY2VkXG4gICAgICApKGNvZGUpXG4gICAgfSAvLyBTaG9ydGN1dCByZWZlcmVuY2U6IGBbYXNkXWA/XG5cbiAgICByZXR1cm4gZGVmaW5lZCA/IG9rKGNvZGUpIDogYmFsYW5jZWQoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGJhbGFuY2VkKGNvZGUpIHtcbiAgICBsYWJlbFN0YXJ0Ll9iYWxhbmNlZCA9IHRydWVcbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gdG9rZW5pemVSZXNvdXJjZShlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdyZXNvdXJjZScpXG4gICAgZWZmZWN0cy5lbnRlcigncmVzb3VyY2VNYXJrZXInKVxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIGVmZmVjdHMuZXhpdCgncmVzb3VyY2VNYXJrZXInKVxuICAgIHJldHVybiBmYWN0b3J5V2hpdGVzcGFjZShlZmZlY3RzLCBvcGVuKVxuICB9XG5cbiAgZnVuY3Rpb24gb3Blbihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDQxKSB7XG4gICAgICByZXR1cm4gZW5kKGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhY3RvcnlEZXN0aW5hdGlvbihcbiAgICAgIGVmZmVjdHMsXG4gICAgICBkZXN0aW5hdGlvbkFmdGVyLFxuICAgICAgbm9rLFxuICAgICAgJ3Jlc291cmNlRGVzdGluYXRpb24nLFxuICAgICAgJ3Jlc291cmNlRGVzdGluYXRpb25MaXRlcmFsJyxcbiAgICAgICdyZXNvdXJjZURlc3RpbmF0aW9uTGl0ZXJhbE1hcmtlcicsXG4gICAgICAncmVzb3VyY2VEZXN0aW5hdGlvblJhdycsXG4gICAgICAncmVzb3VyY2VEZXN0aW5hdGlvblN0cmluZycsXG4gICAgICAzXG4gICAgKShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVzdGluYXRpb25BZnRlcihjb2RlKSB7XG4gICAgcmV0dXJuIG1hcmtkb3duTGluZUVuZGluZ09yU3BhY2UoY29kZSlcbiAgICAgID8gZmFjdG9yeVdoaXRlc3BhY2UoZWZmZWN0cywgYmV0d2VlbikoY29kZSlcbiAgICAgIDogZW5kKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBiZXR3ZWVuKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gMzQgfHwgY29kZSA9PT0gMzkgfHwgY29kZSA9PT0gNDApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5VGl0bGUoXG4gICAgICAgIGVmZmVjdHMsXG4gICAgICAgIGZhY3RvcnlXaGl0ZXNwYWNlKGVmZmVjdHMsIGVuZCksXG4gICAgICAgIG5vayxcbiAgICAgICAgJ3Jlc291cmNlVGl0bGUnLFxuICAgICAgICAncmVzb3VyY2VUaXRsZU1hcmtlcicsXG4gICAgICAgICdyZXNvdXJjZVRpdGxlU3RyaW5nJ1xuICAgICAgKShjb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBlbmQoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDQxKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdyZXNvdXJjZU1hcmtlcicpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdCgncmVzb3VyY2VNYXJrZXInKVxuICAgICAgZWZmZWN0cy5leGl0KCdyZXNvdXJjZScpXG4gICAgICByZXR1cm4gb2tcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gdG9rZW5pemVGdWxsUmVmZXJlbmNlKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICByZXR1cm4gZmFjdG9yeUxhYmVsLmNhbGwoXG4gICAgICBzZWxmLFxuICAgICAgZWZmZWN0cyxcbiAgICAgIGFmdGVyTGFiZWwsXG4gICAgICBub2ssXG4gICAgICAncmVmZXJlbmNlJyxcbiAgICAgICdyZWZlcmVuY2VNYXJrZXInLFxuICAgICAgJ3JlZmVyZW5jZVN0cmluZydcbiAgICApKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBhZnRlckxhYmVsKGNvZGUpIHtcbiAgICByZXR1cm4gc2VsZi5wYXJzZXIuZGVmaW5lZC5pbmRleE9mKFxuICAgICAgbm9ybWFsaXplSWRlbnRpZmllcihcbiAgICAgICAgc2VsZi5zbGljZVNlcmlhbGl6ZShzZWxmLmV2ZW50c1tzZWxmLmV2ZW50cy5sZW5ndGggLSAxXVsxXSkuc2xpY2UoMSwgLTEpXG4gICAgICApXG4gICAgKSA8IDBcbiAgICAgID8gbm9rKGNvZGUpXG4gICAgICA6IG9rKGNvZGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gdG9rZW5pemVDb2xsYXBzZWRSZWZlcmVuY2UoZWZmZWN0cywgb2ssIG5vaykge1xuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgZWZmZWN0cy5lbnRlcigncmVmZXJlbmNlJylcbiAgICBlZmZlY3RzLmVudGVyKCdyZWZlcmVuY2VNYXJrZXInKVxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIGVmZmVjdHMuZXhpdCgncmVmZXJlbmNlTWFya2VyJylcbiAgICByZXR1cm4gb3BlblxuICB9XG5cbiAgZnVuY3Rpb24gb3Blbihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDkzKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdyZWZlcmVuY2VNYXJrZXInKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQoJ3JlZmVyZW5jZU1hcmtlcicpXG4gICAgICBlZmZlY3RzLmV4aXQoJ3JlZmVyZW5jZScpXG4gICAgICByZXR1cm4gb2tcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsYWJlbEVuZFxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBsYWJlbEVuZCA9IHJlcXVpcmUoJy4vbGFiZWwtZW5kLmpzJylcblxudmFyIGxhYmVsU3RhcnRMaW5rID0ge1xuICBuYW1lOiAnbGFiZWxTdGFydExpbmsnLFxuICB0b2tlbml6ZTogdG9rZW5pemVMYWJlbFN0YXJ0TGluayxcbiAgcmVzb2x2ZUFsbDogbGFiZWxFbmQucmVzb2x2ZUFsbFxufVxuXG5mdW5jdGlvbiB0b2tlbml6ZUxhYmVsU3RhcnRMaW5rKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdsYWJlbExpbmsnKVxuICAgIGVmZmVjdHMuZW50ZXIoJ2xhYmVsTWFya2VyJylcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQoJ2xhYmVsTWFya2VyJylcbiAgICBlZmZlY3RzLmV4aXQoJ2xhYmVsTGluaycpXG4gICAgcmV0dXJuIGFmdGVyXG4gIH1cblxuICBmdW5jdGlvbiBhZnRlcihjb2RlKSB7XG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gY29kZSA9PT0gOTQgJiZcbiAgICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgICAnX2hpZGRlbkZvb3Rub3RlU3VwcG9ydCcgaW4gc2VsZi5wYXJzZXIuY29uc3RydWN0c1xuICAgICAgPyAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICBub2soY29kZSlcbiAgICAgIDogb2soY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxhYmVsU3RhcnRMaW5rXG4iLCIndXNlIHN0cmljdCdcblxudmFyIGZhY3RvcnlTcGFjZSA9IHJlcXVpcmUoJy4vZmFjdG9yeS1zcGFjZS5qcycpXG5cbnZhciBsaW5lRW5kaW5nID0ge1xuICBuYW1lOiAnbGluZUVuZGluZycsXG4gIHRva2VuaXplOiB0b2tlbml6ZUxpbmVFbmRpbmdcbn1cblxuZnVuY3Rpb24gdG9rZW5pemVMaW5lRW5kaW5nKGVmZmVjdHMsIG9rKSB7XG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdsaW5lRW5kaW5nJylcbiAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICBlZmZlY3RzLmV4aXQoJ2xpbmVFbmRpbmcnKVxuICAgIHJldHVybiBmYWN0b3J5U3BhY2UoZWZmZWN0cywgb2ssICdsaW5lUHJlZml4JylcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpbmVFbmRpbmdcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgbWFya2Rvd25MaW5lRW5kaW5nID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLWxpbmUtZW5kaW5nLmpzJylcbnZhciBtYXJrZG93blNwYWNlID0gcmVxdWlyZSgnLi4vY2hhcmFjdGVyL21hcmtkb3duLXNwYWNlLmpzJylcbnZhciBmYWN0b3J5U3BhY2UgPSByZXF1aXJlKCcuL2ZhY3Rvcnktc3BhY2UuanMnKVxuXG52YXIgdGhlbWF0aWNCcmVhayA9IHtcbiAgbmFtZTogJ3RoZW1hdGljQnJlYWsnLFxuICB0b2tlbml6ZTogdG9rZW5pemVUaGVtYXRpY0JyZWFrXG59XG5cbmZ1bmN0aW9uIHRva2VuaXplVGhlbWF0aWNCcmVhayhlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHZhciBzaXplID0gMFxuICB2YXIgbWFya2VyXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCd0aGVtYXRpY0JyZWFrJylcbiAgICBtYXJrZXIgPSBjb2RlXG4gICAgcmV0dXJuIGF0QnJlYWsoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGF0QnJlYWsoY29kZSkge1xuICAgIGlmIChjb2RlID09PSBtYXJrZXIpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ3RoZW1hdGljQnJlYWtTZXF1ZW5jZScpXG4gICAgICByZXR1cm4gc2VxdWVuY2UoY29kZSlcbiAgICB9XG5cbiAgICBpZiAobWFya2Rvd25TcGFjZShjb2RlKSkge1xuICAgICAgcmV0dXJuIGZhY3RvcnlTcGFjZShlZmZlY3RzLCBhdEJyZWFrLCAnd2hpdGVzcGFjZScpKGNvZGUpXG4gICAgfVxuXG4gICAgaWYgKHNpemUgPCAzIHx8IChjb2RlICE9PSBudWxsICYmICFtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpKSB7XG4gICAgICByZXR1cm4gbm9rKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5leGl0KCd0aGVtYXRpY0JyZWFrJylcbiAgICByZXR1cm4gb2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcXVlbmNlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gbWFya2VyKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHNpemUrK1xuICAgICAgcmV0dXJuIHNlcXVlbmNlXG4gICAgfVxuXG4gICAgZWZmZWN0cy5leGl0KCd0aGVtYXRpY0JyZWFrU2VxdWVuY2UnKVxuICAgIHJldHVybiBhdEJyZWFrKGNvZGUpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aGVtYXRpY0JyZWFrXG4iLCIndXNlIHN0cmljdCdcblxudmFyIGFzY2lpRGlnaXQgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvYXNjaWktZGlnaXQuanMnKVxudmFyIG1hcmtkb3duU3BhY2UgPSByZXF1aXJlKCcuLi9jaGFyYWN0ZXIvbWFya2Rvd24tc3BhY2UuanMnKVxudmFyIHByZWZpeFNpemUgPSByZXF1aXJlKCcuLi91dGlsL3ByZWZpeC1zaXplLmpzJylcbnZhciBzaXplQ2h1bmtzID0gcmVxdWlyZSgnLi4vdXRpbC9zaXplLWNodW5rcy5qcycpXG52YXIgZmFjdG9yeVNwYWNlID0gcmVxdWlyZSgnLi9mYWN0b3J5LXNwYWNlLmpzJylcbnZhciBwYXJ0aWFsQmxhbmtMaW5lID0gcmVxdWlyZSgnLi9wYXJ0aWFsLWJsYW5rLWxpbmUuanMnKVxudmFyIHRoZW1hdGljQnJlYWsgPSByZXF1aXJlKCcuL3RoZW1hdGljLWJyZWFrLmpzJylcblxudmFyIGxpc3QgPSB7XG4gIG5hbWU6ICdsaXN0JyxcbiAgdG9rZW5pemU6IHRva2VuaXplTGlzdFN0YXJ0LFxuICBjb250aW51YXRpb246IHtcbiAgICB0b2tlbml6ZTogdG9rZW5pemVMaXN0Q29udGludWF0aW9uXG4gIH0sXG4gIGV4aXQ6IHRva2VuaXplTGlzdEVuZFxufVxudmFyIGxpc3RJdGVtUHJlZml4V2hpdGVzcGFjZUNvbnN0cnVjdCA9IHtcbiAgdG9rZW5pemU6IHRva2VuaXplTGlzdEl0ZW1QcmVmaXhXaGl0ZXNwYWNlLFxuICBwYXJ0aWFsOiB0cnVlXG59XG52YXIgaW5kZW50Q29uc3RydWN0ID0ge1xuICB0b2tlbml6ZTogdG9rZW5pemVJbmRlbnQsXG4gIHBhcnRpYWw6IHRydWVcbn1cblxuZnVuY3Rpb24gdG9rZW5pemVMaXN0U3RhcnQoZWZmZWN0cywgb2ssIG5vaykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgdmFyIGluaXRpYWxTaXplID0gcHJlZml4U2l6ZShzZWxmLmV2ZW50cywgJ2xpbmVQcmVmaXgnKVxuICB2YXIgc2l6ZSA9IDBcbiAgcmV0dXJuIHN0YXJ0XG5cbiAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgIHZhciBraW5kID1cbiAgICAgIHNlbGYuY29udGFpbmVyU3RhdGUudHlwZSB8fFxuICAgICAgKGNvZGUgPT09IDQyIHx8IGNvZGUgPT09IDQzIHx8IGNvZGUgPT09IDQ1XG4gICAgICAgID8gJ2xpc3RVbm9yZGVyZWQnXG4gICAgICAgIDogJ2xpc3RPcmRlcmVkJylcblxuICAgIGlmIChcbiAgICAgIGtpbmQgPT09ICdsaXN0VW5vcmRlcmVkJ1xuICAgICAgICA/ICFzZWxmLmNvbnRhaW5lclN0YXRlLm1hcmtlciB8fCBjb2RlID09PSBzZWxmLmNvbnRhaW5lclN0YXRlLm1hcmtlclxuICAgICAgICA6IGFzY2lpRGlnaXQoY29kZSlcbiAgICApIHtcbiAgICAgIGlmICghc2VsZi5jb250YWluZXJTdGF0ZS50eXBlKSB7XG4gICAgICAgIHNlbGYuY29udGFpbmVyU3RhdGUudHlwZSA9IGtpbmRcbiAgICAgICAgZWZmZWN0cy5lbnRlcihraW5kLCB7XG4gICAgICAgICAgX2NvbnRhaW5lcjogdHJ1ZVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBpZiAoa2luZCA9PT0gJ2xpc3RVbm9yZGVyZWQnKSB7XG4gICAgICAgIGVmZmVjdHMuZW50ZXIoJ2xpc3RJdGVtUHJlZml4JylcbiAgICAgICAgcmV0dXJuIGNvZGUgPT09IDQyIHx8IGNvZGUgPT09IDQ1XG4gICAgICAgICAgPyBlZmZlY3RzLmNoZWNrKHRoZW1hdGljQnJlYWssIG5vaywgYXRNYXJrZXIpKGNvZGUpXG4gICAgICAgICAgOiBhdE1hcmtlcihjb2RlKVxuICAgICAgfVxuXG4gICAgICBpZiAoIXNlbGYuaW50ZXJydXB0IHx8IGNvZGUgPT09IDQ5KSB7XG4gICAgICAgIGVmZmVjdHMuZW50ZXIoJ2xpc3RJdGVtUHJlZml4JylcbiAgICAgICAgZWZmZWN0cy5lbnRlcignbGlzdEl0ZW1WYWx1ZScpXG4gICAgICAgIHJldHVybiBpbnNpZGUoY29kZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBpbnNpZGUoY29kZSkge1xuICAgIGlmIChhc2NpaURpZ2l0KGNvZGUpICYmICsrc2l6ZSA8IDEwKSB7XG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIHJldHVybiBpbnNpZGVcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAoIXNlbGYuaW50ZXJydXB0IHx8IHNpemUgPCAyKSAmJlxuICAgICAgKHNlbGYuY29udGFpbmVyU3RhdGUubWFya2VyXG4gICAgICAgID8gY29kZSA9PT0gc2VsZi5jb250YWluZXJTdGF0ZS5tYXJrZXJcbiAgICAgICAgOiBjb2RlID09PSA0MSB8fCBjb2RlID09PSA0NilcbiAgICApIHtcbiAgICAgIGVmZmVjdHMuZXhpdCgnbGlzdEl0ZW1WYWx1ZScpXG4gICAgICByZXR1cm4gYXRNYXJrZXIoY29kZSlcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBhdE1hcmtlcihjb2RlKSB7XG4gICAgZWZmZWN0cy5lbnRlcignbGlzdEl0ZW1NYXJrZXInKVxuICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgIGVmZmVjdHMuZXhpdCgnbGlzdEl0ZW1NYXJrZXInKVxuICAgIHNlbGYuY29udGFpbmVyU3RhdGUubWFya2VyID0gc2VsZi5jb250YWluZXJTdGF0ZS5tYXJrZXIgfHwgY29kZVxuICAgIHJldHVybiBlZmZlY3RzLmNoZWNrKFxuICAgICAgcGFydGlhbEJsYW5rTGluZSwgLy8gQ2Fu4oCZdCBiZSBlbXB0eSB3aGVuIGludGVycnVwdGluZy5cbiAgICAgIHNlbGYuaW50ZXJydXB0ID8gbm9rIDogb25CbGFuayxcbiAgICAgIGVmZmVjdHMuYXR0ZW1wdChcbiAgICAgICAgbGlzdEl0ZW1QcmVmaXhXaGl0ZXNwYWNlQ29uc3RydWN0LFxuICAgICAgICBlbmRPZlByZWZpeCxcbiAgICAgICAgb3RoZXJQcmVmaXhcbiAgICAgIClcbiAgICApXG4gIH1cblxuICBmdW5jdGlvbiBvbkJsYW5rKGNvZGUpIHtcbiAgICBzZWxmLmNvbnRhaW5lclN0YXRlLmluaXRpYWxCbGFua0xpbmUgPSB0cnVlXG4gICAgaW5pdGlhbFNpemUrK1xuICAgIHJldHVybiBlbmRPZlByZWZpeChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gb3RoZXJQcmVmaXgoY29kZSkge1xuICAgIGlmIChtYXJrZG93blNwYWNlKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdsaXN0SXRlbVByZWZpeFdoaXRlc3BhY2UnKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2xpc3RJdGVtUHJlZml4V2hpdGVzcGFjZScpXG4gICAgICByZXR1cm4gZW5kT2ZQcmVmaXhcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBlbmRPZlByZWZpeChjb2RlKSB7XG4gICAgc2VsZi5jb250YWluZXJTdGF0ZS5zaXplID1cbiAgICAgIGluaXRpYWxTaXplICsgc2l6ZUNodW5rcyhzZWxmLnNsaWNlU3RyZWFtKGVmZmVjdHMuZXhpdCgnbGlzdEl0ZW1QcmVmaXgnKSkpXG4gICAgcmV0dXJuIG9rKGNvZGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gdG9rZW5pemVMaXN0Q29udGludWF0aW9uKGVmZmVjdHMsIG9rLCBub2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHNlbGYuY29udGFpbmVyU3RhdGUuX2Nsb3NlRmxvdyA9IHVuZGVmaW5lZFxuICByZXR1cm4gZWZmZWN0cy5jaGVjayhwYXJ0aWFsQmxhbmtMaW5lLCBvbkJsYW5rLCBub3RCbGFuaylcblxuICBmdW5jdGlvbiBvbkJsYW5rKGNvZGUpIHtcbiAgICBzZWxmLmNvbnRhaW5lclN0YXRlLmZ1cnRoZXJCbGFua0xpbmVzID1cbiAgICAgIHNlbGYuY29udGFpbmVyU3RhdGUuZnVydGhlckJsYW5rTGluZXMgfHxcbiAgICAgIHNlbGYuY29udGFpbmVyU3RhdGUuaW5pdGlhbEJsYW5rTGluZSAvLyBXZSBoYXZlIGEgYmxhbmsgbGluZS5cbiAgICAvLyBTdGlsbCwgdHJ5IHRvIGNvbnN1bWUgYXQgbW9zdCB0aGUgaXRlbXMgc2l6ZS5cblxuICAgIHJldHVybiBmYWN0b3J5U3BhY2UoXG4gICAgICBlZmZlY3RzLFxuICAgICAgb2ssXG4gICAgICAnbGlzdEl0ZW1JbmRlbnQnLFxuICAgICAgc2VsZi5jb250YWluZXJTdGF0ZS5zaXplICsgMVxuICAgICkoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vdEJsYW5rKGNvZGUpIHtcbiAgICBpZiAoc2VsZi5jb250YWluZXJTdGF0ZS5mdXJ0aGVyQmxhbmtMaW5lcyB8fCAhbWFya2Rvd25TcGFjZShjb2RlKSkge1xuICAgICAgc2VsZi5jb250YWluZXJTdGF0ZS5mdXJ0aGVyQmxhbmtMaW5lcyA9IHNlbGYuY29udGFpbmVyU3RhdGUuaW5pdGlhbEJsYW5rTGluZSA9IHVuZGVmaW5lZFxuICAgICAgcmV0dXJuIG5vdEluQ3VycmVudEl0ZW0oY29kZSlcbiAgICB9XG5cbiAgICBzZWxmLmNvbnRhaW5lclN0YXRlLmZ1cnRoZXJCbGFua0xpbmVzID0gc2VsZi5jb250YWluZXJTdGF0ZS5pbml0aWFsQmxhbmtMaW5lID0gdW5kZWZpbmVkXG4gICAgcmV0dXJuIGVmZmVjdHMuYXR0ZW1wdChpbmRlbnRDb25zdHJ1Y3QsIG9rLCBub3RJbkN1cnJlbnRJdGVtKShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gbm90SW5DdXJyZW50SXRlbShjb2RlKSB7XG4gICAgLy8gV2hpbGUgd2UgZG8gY29udGludWUsIHdlIHNpZ25hbCB0aGF0IHRoZSBmbG93IHNob3VsZCBiZSBjbG9zZWQuXG4gICAgc2VsZi5jb250YWluZXJTdGF0ZS5fY2xvc2VGbG93ID0gdHJ1ZSAvLyBBcyB3ZeKAmXJlIGNsb3NpbmcgZmxvdywgd2XigJlyZSBubyBsb25nZXIgaW50ZXJydXB0aW5nLlxuXG4gICAgc2VsZi5pbnRlcnJ1cHQgPSB1bmRlZmluZWRcbiAgICByZXR1cm4gZmFjdG9yeVNwYWNlKFxuICAgICAgZWZmZWN0cyxcbiAgICAgIGVmZmVjdHMuYXR0ZW1wdChsaXN0LCBvaywgbm9rKSxcbiAgICAgICdsaW5lUHJlZml4JyxcbiAgICAgIHNlbGYucGFyc2VyLmNvbnN0cnVjdHMuZGlzYWJsZS5udWxsLmluZGV4T2YoJ2NvZGVJbmRlbnRlZCcpID4gLTFcbiAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgOiA0XG4gICAgKShjb2RlKVxuICB9XG59XG5cbmZ1bmN0aW9uIHRva2VuaXplSW5kZW50KGVmZmVjdHMsIG9rLCBub2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHJldHVybiBmYWN0b3J5U3BhY2UoXG4gICAgZWZmZWN0cyxcbiAgICBhZnRlclByZWZpeCxcbiAgICAnbGlzdEl0ZW1JbmRlbnQnLFxuICAgIHNlbGYuY29udGFpbmVyU3RhdGUuc2l6ZSArIDFcbiAgKVxuXG4gIGZ1bmN0aW9uIGFmdGVyUHJlZml4KGNvZGUpIHtcbiAgICByZXR1cm4gcHJlZml4U2l6ZShzZWxmLmV2ZW50cywgJ2xpc3RJdGVtSW5kZW50JykgPT09XG4gICAgICBzZWxmLmNvbnRhaW5lclN0YXRlLnNpemVcbiAgICAgID8gb2soY29kZSlcbiAgICAgIDogbm9rKGNvZGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gdG9rZW5pemVMaXN0RW5kKGVmZmVjdHMpIHtcbiAgZWZmZWN0cy5leGl0KHRoaXMuY29udGFpbmVyU3RhdGUudHlwZSlcbn1cblxuZnVuY3Rpb24gdG9rZW5pemVMaXN0SXRlbVByZWZpeFdoaXRlc3BhY2UoZWZmZWN0cywgb2ssIG5vaykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgcmV0dXJuIGZhY3RvcnlTcGFjZShcbiAgICBlZmZlY3RzLFxuICAgIGFmdGVyUHJlZml4LFxuICAgICdsaXN0SXRlbVByZWZpeFdoaXRlc3BhY2UnLFxuICAgIHNlbGYucGFyc2VyLmNvbnN0cnVjdHMuZGlzYWJsZS5udWxsLmluZGV4T2YoJ2NvZGVJbmRlbnRlZCcpID4gLTFcbiAgICAgID8gdW5kZWZpbmVkXG4gICAgICA6IDQgKyAxXG4gIClcblxuICBmdW5jdGlvbiBhZnRlclByZWZpeChjb2RlKSB7XG4gICAgcmV0dXJuIG1hcmtkb3duU3BhY2UoY29kZSkgfHxcbiAgICAgICFwcmVmaXhTaXplKHNlbGYuZXZlbnRzLCAnbGlzdEl0ZW1QcmVmaXhXaGl0ZXNwYWNlJylcbiAgICAgID8gbm9rKGNvZGUpXG4gICAgICA6IG9rKGNvZGUpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaXN0XG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1hcmtkb3duTGluZUVuZGluZyA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy5qcycpXG52YXIgc2hhbGxvdyA9IHJlcXVpcmUoJy4uL3V0aWwvc2hhbGxvdy5qcycpXG52YXIgZmFjdG9yeVNwYWNlID0gcmVxdWlyZSgnLi9mYWN0b3J5LXNwYWNlLmpzJylcblxudmFyIHNldGV4dFVuZGVybGluZSA9IHtcbiAgbmFtZTogJ3NldGV4dFVuZGVybGluZScsXG4gIHRva2VuaXplOiB0b2tlbml6ZVNldGV4dFVuZGVybGluZSxcbiAgcmVzb2x2ZVRvOiByZXNvbHZlVG9TZXRleHRVbmRlcmxpbmVcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVRvU2V0ZXh0VW5kZXJsaW5lKGV2ZW50cywgY29udGV4dCkge1xuICB2YXIgaW5kZXggPSBldmVudHMubGVuZ3RoXG4gIHZhciBjb250ZW50XG4gIHZhciB0ZXh0XG4gIHZhciBkZWZpbml0aW9uXG4gIHZhciBoZWFkaW5nIC8vIEZpbmQgdGhlIG9wZW5pbmcgb2YgdGhlIGNvbnRlbnQuXG4gIC8vIEl04oCZbGwgYWx3YXlzIGV4aXN0OiB3ZSBkb27igJl0IHRva2VuaXplIGlmIGl0IGlzbuKAmXQgdGhlcmUuXG5cbiAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICBpZiAoZXZlbnRzW2luZGV4XVswXSA9PT0gJ2VudGVyJykge1xuICAgICAgaWYgKGV2ZW50c1tpbmRleF1bMV0udHlwZSA9PT0gJ2NvbnRlbnQnKSB7XG4gICAgICAgIGNvbnRlbnQgPSBpbmRleFxuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBpZiAoZXZlbnRzW2luZGV4XVsxXS50eXBlID09PSAncGFyYWdyYXBoJykge1xuICAgICAgICB0ZXh0ID0gaW5kZXhcbiAgICAgIH1cbiAgICB9IC8vIEV4aXRcbiAgICBlbHNlIHtcbiAgICAgIGlmIChldmVudHNbaW5kZXhdWzFdLnR5cGUgPT09ICdjb250ZW50Jykge1xuICAgICAgICAvLyBSZW1vdmUgdGhlIGNvbnRlbnQgZW5kIChpZiBuZWVkZWQgd2XigJlsbCBhZGQgaXQgbGF0ZXIpXG4gICAgICAgIGV2ZW50cy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICB9XG5cbiAgICAgIGlmICghZGVmaW5pdGlvbiAmJiBldmVudHNbaW5kZXhdWzFdLnR5cGUgPT09ICdkZWZpbml0aW9uJykge1xuICAgICAgICBkZWZpbml0aW9uID0gaW5kZXhcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoZWFkaW5nID0ge1xuICAgIHR5cGU6ICdzZXRleHRIZWFkaW5nJyxcbiAgICBzdGFydDogc2hhbGxvdyhldmVudHNbdGV4dF1bMV0uc3RhcnQpLFxuICAgIGVuZDogc2hhbGxvdyhldmVudHNbZXZlbnRzLmxlbmd0aCAtIDFdWzFdLmVuZClcbiAgfSAvLyBDaGFuZ2UgdGhlIHBhcmFncmFwaCB0byBzZXRleHQgaGVhZGluZyB0ZXh0LlxuXG4gIGV2ZW50c1t0ZXh0XVsxXS50eXBlID0gJ3NldGV4dEhlYWRpbmdUZXh0JyAvLyBJZiB3ZSBoYXZlIGRlZmluaXRpb25zIGluIHRoZSBjb250ZW50LCB3ZeKAmWxsIGtlZXAgb24gaGF2aW5nIGNvbnRlbnQsXG4gIC8vIGJ1dCB3ZSBuZWVkIG1vdmUgaXQuXG5cbiAgaWYgKGRlZmluaXRpb24pIHtcbiAgICBldmVudHMuc3BsaWNlKHRleHQsIDAsIFsnZW50ZXInLCBoZWFkaW5nLCBjb250ZXh0XSlcbiAgICBldmVudHMuc3BsaWNlKGRlZmluaXRpb24gKyAxLCAwLCBbJ2V4aXQnLCBldmVudHNbY29udGVudF1bMV0sIGNvbnRleHRdKVxuICAgIGV2ZW50c1tjb250ZW50XVsxXS5lbmQgPSBzaGFsbG93KGV2ZW50c1tkZWZpbml0aW9uXVsxXS5lbmQpXG4gIH0gZWxzZSB7XG4gICAgZXZlbnRzW2NvbnRlbnRdWzFdID0gaGVhZGluZ1xuICB9IC8vIEFkZCB0aGUgaGVhZGluZyBleGl0IGF0IHRoZSBlbmQuXG5cbiAgZXZlbnRzLnB1c2goWydleGl0JywgaGVhZGluZywgY29udGV4dF0pXG4gIHJldHVybiBldmVudHNcbn1cblxuZnVuY3Rpb24gdG9rZW5pemVTZXRleHRVbmRlcmxpbmUoZWZmZWN0cywgb2ssIG5vaykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgdmFyIGluZGV4ID0gc2VsZi5ldmVudHMubGVuZ3RoXG4gIHZhciBtYXJrZXJcbiAgdmFyIHBhcmFncmFwaCAvLyBGaW5kIGFuIG9wZW5pbmcuXG5cbiAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAvLyBTa2lwIGVudGVyL2V4aXQgb2YgbGluZSBlbmRpbmcsIGxpbmUgcHJlZml4LCBhbmQgY29udGVudC5cbiAgICAvLyBXZSBjYW4gbm93IGVpdGhlciBoYXZlIGEgZGVmaW5pdGlvbiBvciBhIHBhcmFncmFwaC5cbiAgICBpZiAoXG4gICAgICBzZWxmLmV2ZW50c1tpbmRleF1bMV0udHlwZSAhPT0gJ2xpbmVFbmRpbmcnICYmXG4gICAgICBzZWxmLmV2ZW50c1tpbmRleF1bMV0udHlwZSAhPT0gJ2xpbmVQcmVmaXgnICYmXG4gICAgICBzZWxmLmV2ZW50c1tpbmRleF1bMV0udHlwZSAhPT0gJ2NvbnRlbnQnXG4gICAgKSB7XG4gICAgICBwYXJhZ3JhcGggPSBzZWxmLmV2ZW50c1tpbmRleF1bMV0udHlwZSA9PT0gJ3BhcmFncmFwaCdcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN0YXJ0XG5cbiAgZnVuY3Rpb24gc3RhcnQoY29kZSkge1xuICAgIGlmICghc2VsZi5sYXp5ICYmIChzZWxmLmludGVycnVwdCB8fCBwYXJhZ3JhcGgpKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdzZXRleHRIZWFkaW5nTGluZScpXG4gICAgICBlZmZlY3RzLmVudGVyKCdzZXRleHRIZWFkaW5nTGluZVNlcXVlbmNlJylcbiAgICAgIG1hcmtlciA9IGNvZGVcbiAgICAgIHJldHVybiBjbG9zaW5nU2VxdWVuY2UoY29kZSlcbiAgICB9XG5cbiAgICByZXR1cm4gbm9rKGNvZGUpXG4gIH1cblxuICBmdW5jdGlvbiBjbG9zaW5nU2VxdWVuY2UoY29kZSkge1xuICAgIGlmIChjb2RlID09PSBtYXJrZXIpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgcmV0dXJuIGNsb3NpbmdTZXF1ZW5jZVxuICAgIH1cblxuICAgIGVmZmVjdHMuZXhpdCgnc2V0ZXh0SGVhZGluZ0xpbmVTZXF1ZW5jZScpXG4gICAgcmV0dXJuIGZhY3RvcnlTcGFjZShlZmZlY3RzLCBjbG9zaW5nU2VxdWVuY2VFbmQsICdsaW5lU3VmZml4JykoY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NpbmdTZXF1ZW5jZUVuZChjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IG51bGwgfHwgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ3NldGV4dEhlYWRpbmdMaW5lJylcbiAgICAgIHJldHVybiBvayhjb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldGV4dFVuZGVybGluZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHt2YWx1ZTogdHJ1ZX0pXG5cbnZhciB0ZXh0JDEgPSByZXF1aXJlKCcuL2luaXRpYWxpemUvdGV4dC5qcycpXG52YXIgYXR0ZW50aW9uID0gcmVxdWlyZSgnLi90b2tlbml6ZS9hdHRlbnRpb24uanMnKVxudmFyIGF1dG9saW5rID0gcmVxdWlyZSgnLi90b2tlbml6ZS9hdXRvbGluay5qcycpXG52YXIgYmxvY2tRdW90ZSA9IHJlcXVpcmUoJy4vdG9rZW5pemUvYmxvY2stcXVvdGUuanMnKVxudmFyIGNoYXJhY3RlckVzY2FwZSA9IHJlcXVpcmUoJy4vdG9rZW5pemUvY2hhcmFjdGVyLWVzY2FwZS5qcycpXG52YXIgY2hhcmFjdGVyUmVmZXJlbmNlID0gcmVxdWlyZSgnLi90b2tlbml6ZS9jaGFyYWN0ZXItcmVmZXJlbmNlLmpzJylcbnZhciBjb2RlRmVuY2VkID0gcmVxdWlyZSgnLi90b2tlbml6ZS9jb2RlLWZlbmNlZC5qcycpXG52YXIgY29kZUluZGVudGVkID0gcmVxdWlyZSgnLi90b2tlbml6ZS9jb2RlLWluZGVudGVkLmpzJylcbnZhciBjb2RlVGV4dCA9IHJlcXVpcmUoJy4vdG9rZW5pemUvY29kZS10ZXh0LmpzJylcbnZhciBkZWZpbml0aW9uID0gcmVxdWlyZSgnLi90b2tlbml6ZS9kZWZpbml0aW9uLmpzJylcbnZhciBoYXJkQnJlYWtFc2NhcGUgPSByZXF1aXJlKCcuL3Rva2VuaXplL2hhcmQtYnJlYWstZXNjYXBlLmpzJylcbnZhciBoZWFkaW5nQXR4ID0gcmVxdWlyZSgnLi90b2tlbml6ZS9oZWFkaW5nLWF0eC5qcycpXG52YXIgaHRtbEZsb3cgPSByZXF1aXJlKCcuL3Rva2VuaXplL2h0bWwtZmxvdy5qcycpXG52YXIgaHRtbFRleHQgPSByZXF1aXJlKCcuL3Rva2VuaXplL2h0bWwtdGV4dC5qcycpXG52YXIgbGFiZWxFbmQgPSByZXF1aXJlKCcuL3Rva2VuaXplL2xhYmVsLWVuZC5qcycpXG52YXIgbGFiZWxTdGFydEltYWdlID0gcmVxdWlyZSgnLi90b2tlbml6ZS9sYWJlbC1zdGFydC1pbWFnZS5qcycpXG52YXIgbGFiZWxTdGFydExpbmsgPSByZXF1aXJlKCcuL3Rva2VuaXplL2xhYmVsLXN0YXJ0LWxpbmsuanMnKVxudmFyIGxpbmVFbmRpbmcgPSByZXF1aXJlKCcuL3Rva2VuaXplL2xpbmUtZW5kaW5nLmpzJylcbnZhciBsaXN0ID0gcmVxdWlyZSgnLi90b2tlbml6ZS9saXN0LmpzJylcbnZhciBzZXRleHRVbmRlcmxpbmUgPSByZXF1aXJlKCcuL3Rva2VuaXplL3NldGV4dC11bmRlcmxpbmUuanMnKVxudmFyIHRoZW1hdGljQnJlYWsgPSByZXF1aXJlKCcuL3Rva2VuaXplL3RoZW1hdGljLWJyZWFrLmpzJylcblxudmFyIGRvY3VtZW50ID0ge1xuICA0MjogbGlzdCxcbiAgLy8gQXN0ZXJpc2tcbiAgNDM6IGxpc3QsXG4gIC8vIFBsdXMgc2lnblxuICA0NTogbGlzdCxcbiAgLy8gRGFzaFxuICA0ODogbGlzdCxcbiAgLy8gMFxuICA0OTogbGlzdCxcbiAgLy8gMVxuICA1MDogbGlzdCxcbiAgLy8gMlxuICA1MTogbGlzdCxcbiAgLy8gM1xuICA1MjogbGlzdCxcbiAgLy8gNFxuICA1MzogbGlzdCxcbiAgLy8gNVxuICA1NDogbGlzdCxcbiAgLy8gNlxuICA1NTogbGlzdCxcbiAgLy8gN1xuICA1NjogbGlzdCxcbiAgLy8gOFxuICA1NzogbGlzdCxcbiAgLy8gOVxuICA2MjogYmxvY2tRdW90ZSAvLyBHcmVhdGVyIHRoYW5cbn1cbnZhciBjb250ZW50SW5pdGlhbCA9IHtcbiAgOTE6IGRlZmluaXRpb24gLy8gTGVmdCBzcXVhcmUgYnJhY2tldFxufVxudmFyIGZsb3dJbml0aWFsID0ge1xuICAnLTInOiBjb2RlSW5kZW50ZWQsXG4gIC8vIEhvcml6b250YWwgdGFiXG4gICctMSc6IGNvZGVJbmRlbnRlZCxcbiAgLy8gVmlydHVhbCBzcGFjZVxuICAzMjogY29kZUluZGVudGVkIC8vIFNwYWNlXG59XG52YXIgZmxvdyA9IHtcbiAgMzU6IGhlYWRpbmdBdHgsXG4gIC8vIE51bWJlciBzaWduXG4gIDQyOiB0aGVtYXRpY0JyZWFrLFxuICAvLyBBc3Rlcmlza1xuICA0NTogW3NldGV4dFVuZGVybGluZSwgdGhlbWF0aWNCcmVha10sXG4gIC8vIERhc2hcbiAgNjA6IGh0bWxGbG93LFxuICAvLyBMZXNzIHRoYW5cbiAgNjE6IHNldGV4dFVuZGVybGluZSxcbiAgLy8gRXF1YWxzIHRvXG4gIDk1OiB0aGVtYXRpY0JyZWFrLFxuICAvLyBVbmRlcnNjb3JlXG4gIDk2OiBjb2RlRmVuY2VkLFxuICAvLyBHcmF2ZSBhY2NlbnRcbiAgMTI2OiBjb2RlRmVuY2VkIC8vIFRpbGRlXG59XG52YXIgc3RyaW5nID0ge1xuICAzODogY2hhcmFjdGVyUmVmZXJlbmNlLFxuICAvLyBBbXBlcnNhbmRcbiAgOTI6IGNoYXJhY3RlckVzY2FwZSAvLyBCYWNrc2xhc2hcbn1cbnZhciB0ZXh0ID0ge1xuICAnLTUnOiBsaW5lRW5kaW5nLFxuICAvLyBDYXJyaWFnZSByZXR1cm5cbiAgJy00JzogbGluZUVuZGluZyxcbiAgLy8gTGluZSBmZWVkXG4gICctMyc6IGxpbmVFbmRpbmcsXG4gIC8vIENhcnJpYWdlIHJldHVybiArIGxpbmUgZmVlZFxuICAzMzogbGFiZWxTdGFydEltYWdlLFxuICAvLyBFeGNsYW1hdGlvbiBtYXJrXG4gIDM4OiBjaGFyYWN0ZXJSZWZlcmVuY2UsXG4gIC8vIEFtcGVyc2FuZFxuICA0MjogYXR0ZW50aW9uLFxuICAvLyBBc3Rlcmlza1xuICA2MDogW2F1dG9saW5rLCBodG1sVGV4dF0sXG4gIC8vIExlc3MgdGhhblxuICA5MTogbGFiZWxTdGFydExpbmssXG4gIC8vIExlZnQgc3F1YXJlIGJyYWNrZXRcbiAgOTI6IFtoYXJkQnJlYWtFc2NhcGUsIGNoYXJhY3RlckVzY2FwZV0sXG4gIC8vIEJhY2tzbGFzaFxuICA5MzogbGFiZWxFbmQsXG4gIC8vIFJpZ2h0IHNxdWFyZSBicmFja2V0XG4gIDk1OiBhdHRlbnRpb24sXG4gIC8vIFVuZGVyc2NvcmVcbiAgOTY6IGNvZGVUZXh0IC8vIEdyYXZlIGFjY2VudFxufVxudmFyIGluc2lkZVNwYW4gPSB7XG4gIG51bGw6IFthdHRlbnRpb24sIHRleHQkMS5yZXNvbHZlcl1cbn1cbnZhciBkaXNhYmxlID0ge1xuICBudWxsOiBbXVxufVxuXG5leHBvcnRzLmNvbnRlbnRJbml0aWFsID0gY29udGVudEluaXRpYWxcbmV4cG9ydHMuZGlzYWJsZSA9IGRpc2FibGVcbmV4cG9ydHMuZG9jdW1lbnQgPSBkb2N1bWVudFxuZXhwb3J0cy5mbG93ID0gZmxvd1xuZXhwb3J0cy5mbG93SW5pdGlhbCA9IGZsb3dJbml0aWFsXG5leHBvcnRzLmluc2lkZVNwYW4gPSBpbnNpZGVTcGFuXG5leHBvcnRzLnN0cmluZyA9IHN0cmluZ1xuZXhwb3J0cy50ZXh0ID0gdGV4dFxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBsYWJlbEVuZCA9IHJlcXVpcmUoJy4vbGFiZWwtZW5kLmpzJylcblxudmFyIGxhYmVsU3RhcnRJbWFnZSA9IHtcbiAgbmFtZTogJ2xhYmVsU3RhcnRJbWFnZScsXG4gIHRva2VuaXplOiB0b2tlbml6ZUxhYmVsU3RhcnRJbWFnZSxcbiAgcmVzb2x2ZUFsbDogbGFiZWxFbmQucmVzb2x2ZUFsbFxufVxuXG5mdW5jdGlvbiB0b2tlbml6ZUxhYmVsU3RhcnRJbWFnZShlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICByZXR1cm4gc3RhcnRcblxuICBmdW5jdGlvbiBzdGFydChjb2RlKSB7XG4gICAgZWZmZWN0cy5lbnRlcignbGFiZWxJbWFnZScpXG4gICAgZWZmZWN0cy5lbnRlcignbGFiZWxJbWFnZU1hcmtlcicpXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgZWZmZWN0cy5leGl0KCdsYWJlbEltYWdlTWFya2VyJylcbiAgICByZXR1cm4gb3BlblxuICB9XG5cbiAgZnVuY3Rpb24gb3Blbihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPT09IDkxKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdsYWJlbE1hcmtlcicpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdCgnbGFiZWxNYXJrZXInKVxuICAgICAgZWZmZWN0cy5leGl0KCdsYWJlbEltYWdlJylcbiAgICAgIHJldHVybiBhZnRlclxuICAgIH1cblxuICAgIHJldHVybiBub2soY29kZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGFmdGVyKGNvZGUpIHtcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiBjb2RlID09PSA5NCAmJlxuICAgICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAgICdfaGlkZGVuRm9vdG5vdGVTdXBwb3J0JyBpbiBzZWxmLnBhcnNlci5jb25zdHJ1Y3RzXG4gICAgICA/IC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgICAgIG5vayhjb2RlKVxuICAgICAgOiBvayhjb2RlKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGFiZWxTdGFydEltYWdlXG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1hcmtkb3duTGluZUVuZGluZyA9IHJlcXVpcmUoJy4uL2NoYXJhY3Rlci9tYXJrZG93bi1saW5lLWVuZGluZy5qcycpXG5cbnZhciBjb2RlVGV4dCA9IHtcbiAgbmFtZTogJ2NvZGVUZXh0JyxcbiAgdG9rZW5pemU6IHRva2VuaXplQ29kZVRleHQsXG4gIHJlc29sdmU6IHJlc29sdmVDb2RlVGV4dCxcbiAgcHJldmlvdXM6IHByZXZpb3VzXG59XG5cbmZ1bmN0aW9uIHJlc29sdmVDb2RlVGV4dChldmVudHMpIHtcbiAgdmFyIHRhaWxFeGl0SW5kZXggPSBldmVudHMubGVuZ3RoIC0gNFxuICB2YXIgaGVhZEVudGVySW5kZXggPSAzXG4gIHZhciBpbmRleFxuICB2YXIgZW50ZXIgLy8gSWYgd2Ugc3RhcnQgYW5kIGVuZCB3aXRoIGFuIEVPTCBvciBhIHNwYWNlLlxuXG4gIGlmIChcbiAgICAoZXZlbnRzW2hlYWRFbnRlckluZGV4XVsxXS50eXBlID09PSAnbGluZUVuZGluZycgfHxcbiAgICAgIGV2ZW50c1toZWFkRW50ZXJJbmRleF1bMV0udHlwZSA9PT0gJ3NwYWNlJykgJiZcbiAgICAoZXZlbnRzW3RhaWxFeGl0SW5kZXhdWzFdLnR5cGUgPT09ICdsaW5lRW5kaW5nJyB8fFxuICAgICAgZXZlbnRzW3RhaWxFeGl0SW5kZXhdWzFdLnR5cGUgPT09ICdzcGFjZScpXG4gICkge1xuICAgIGluZGV4ID0gaGVhZEVudGVySW5kZXggLy8gQW5kIHdlIGhhdmUgZGF0YS5cblxuICAgIHdoaWxlICgrK2luZGV4IDwgdGFpbEV4aXRJbmRleCkge1xuICAgICAgaWYgKGV2ZW50c1tpbmRleF1bMV0udHlwZSA9PT0gJ2NvZGVUZXh0RGF0YScpIHtcbiAgICAgICAgLy8gVGhlbiB3ZSBoYXZlIHBhZGRpbmcuXG4gICAgICAgIGV2ZW50c1t0YWlsRXhpdEluZGV4XVsxXS50eXBlID0gZXZlbnRzW2hlYWRFbnRlckluZGV4XVsxXS50eXBlID1cbiAgICAgICAgICAnY29kZVRleHRQYWRkaW5nJ1xuICAgICAgICBoZWFkRW50ZXJJbmRleCArPSAyXG4gICAgICAgIHRhaWxFeGl0SW5kZXggLT0gMlxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgfSAvLyBNZXJnZSBhZGphY2VudCBzcGFjZXMgYW5kIGRhdGEuXG5cbiAgaW5kZXggPSBoZWFkRW50ZXJJbmRleCAtIDFcbiAgdGFpbEV4aXRJbmRleCsrXG5cbiAgd2hpbGUgKCsraW5kZXggPD0gdGFpbEV4aXRJbmRleCkge1xuICAgIGlmIChlbnRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoaW5kZXggIT09IHRhaWxFeGl0SW5kZXggJiYgZXZlbnRzW2luZGV4XVsxXS50eXBlICE9PSAnbGluZUVuZGluZycpIHtcbiAgICAgICAgZW50ZXIgPSBpbmRleFxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBpbmRleCA9PT0gdGFpbEV4aXRJbmRleCB8fFxuICAgICAgZXZlbnRzW2luZGV4XVsxXS50eXBlID09PSAnbGluZUVuZGluZydcbiAgICApIHtcbiAgICAgIGV2ZW50c1tlbnRlcl1bMV0udHlwZSA9ICdjb2RlVGV4dERhdGEnXG5cbiAgICAgIGlmIChpbmRleCAhPT0gZW50ZXIgKyAyKSB7XG4gICAgICAgIGV2ZW50c1tlbnRlcl1bMV0uZW5kID0gZXZlbnRzW2luZGV4IC0gMV1bMV0uZW5kXG4gICAgICAgIGV2ZW50cy5zcGxpY2UoZW50ZXIgKyAyLCBpbmRleCAtIGVudGVyIC0gMilcbiAgICAgICAgdGFpbEV4aXRJbmRleCAtPSBpbmRleCAtIGVudGVyIC0gMlxuICAgICAgICBpbmRleCA9IGVudGVyICsgMlxuICAgICAgfVxuXG4gICAgICBlbnRlciA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBldmVudHNcbn1cblxuZnVuY3Rpb24gcHJldmlvdXMoY29kZSkge1xuICAvLyBJZiB0aGVyZSBpcyBhIHByZXZpb3VzIGNvZGUsIHRoZXJlIHdpbGwgYWx3YXlzIGJlIGEgdGFpbC5cbiAgcmV0dXJuIChcbiAgICBjb2RlICE9PSA5NiB8fFxuICAgIHRoaXMuZXZlbnRzW3RoaXMuZXZlbnRzLmxlbmd0aCAtIDFdWzFdLnR5cGUgPT09ICdjaGFyYWN0ZXJFc2NhcGUnXG4gIClcbn1cblxuZnVuY3Rpb24gdG9rZW5pemVDb2RlVGV4dChlZmZlY3RzLCBvaywgbm9rKSB7XG4gIHZhciBzaXplT3BlbiA9IDBcbiAgdmFyIHNpemVcbiAgdmFyIHRva2VuXG4gIHJldHVybiBzdGFydFxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGNvZGUpIHtcbiAgICBlZmZlY3RzLmVudGVyKCdjb2RlVGV4dCcpXG4gICAgZWZmZWN0cy5lbnRlcignY29kZVRleHRTZXF1ZW5jZScpXG4gICAgcmV0dXJuIG9wZW5pbmdTZXF1ZW5jZShjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gb3BlbmluZ1NlcXVlbmNlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA9PT0gOTYpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgc2l6ZU9wZW4rK1xuICAgICAgcmV0dXJuIG9wZW5pbmdTZXF1ZW5jZVxuICAgIH1cblxuICAgIGVmZmVjdHMuZXhpdCgnY29kZVRleHRTZXF1ZW5jZScpXG4gICAgcmV0dXJuIGdhcChjb2RlKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2FwKGNvZGUpIHtcbiAgICAvLyBFT0YuXG4gICAgaWYgKGNvZGUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBub2soY29kZSlcbiAgICB9IC8vIENsb3NpbmcgZmVuY2U/XG4gICAgLy8gQ291bGQgYWxzbyBiZSBkYXRhLlxuXG4gICAgaWYgKGNvZGUgPT09IDk2KSB7XG4gICAgICB0b2tlbiA9IGVmZmVjdHMuZW50ZXIoJ2NvZGVUZXh0U2VxdWVuY2UnKVxuICAgICAgc2l6ZSA9IDBcbiAgICAgIHJldHVybiBjbG9zaW5nU2VxdWVuY2UoY29kZSlcbiAgICB9IC8vIFRhYnMgZG9u4oCZdCB3b3JrLCBhbmQgdmlydHVhbCBzcGFjZXMgZG9u4oCZdCBtYWtlIHNlbnNlLlxuXG4gICAgaWYgKGNvZGUgPT09IDMyKSB7XG4gICAgICBlZmZlY3RzLmVudGVyKCdzcGFjZScpXG4gICAgICBlZmZlY3RzLmNvbnN1bWUoY29kZSlcbiAgICAgIGVmZmVjdHMuZXhpdCgnc3BhY2UnKVxuICAgICAgcmV0dXJuIGdhcFxuICAgIH1cblxuICAgIGlmIChtYXJrZG93bkxpbmVFbmRpbmcoY29kZSkpIHtcbiAgICAgIGVmZmVjdHMuZW50ZXIoJ2xpbmVFbmRpbmcnKVxuICAgICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgICBlZmZlY3RzLmV4aXQoJ2xpbmVFbmRpbmcnKVxuICAgICAgcmV0dXJuIGdhcFxuICAgIH0gLy8gRGF0YS5cblxuICAgIGVmZmVjdHMuZW50ZXIoJ2NvZGVUZXh0RGF0YScpXG4gICAgcmV0dXJuIGRhdGEoY29kZSlcbiAgfSAvLyBJbiBjb2RlLlxuXG4gIGZ1bmN0aW9uIGRhdGEoY29kZSkge1xuICAgIGlmIChcbiAgICAgIGNvZGUgPT09IG51bGwgfHxcbiAgICAgIGNvZGUgPT09IDMyIHx8XG4gICAgICBjb2RlID09PSA5NiB8fFxuICAgICAgbWFya2Rvd25MaW5lRW5kaW5nKGNvZGUpXG4gICAgKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ2NvZGVUZXh0RGF0YScpXG4gICAgICByZXR1cm4gZ2FwKGNvZGUpXG4gICAgfVxuXG4gICAgZWZmZWN0cy5jb25zdW1lKGNvZGUpXG4gICAgcmV0dXJuIGRhdGFcbiAgfSAvLyBDbG9zaW5nIGZlbmNlLlxuXG4gIGZ1bmN0aW9uIGNsb3NpbmdTZXF1ZW5jZShjb2RlKSB7XG4gICAgLy8gTW9yZS5cbiAgICBpZiAoY29kZSA9PT0gOTYpIHtcbiAgICAgIGVmZmVjdHMuY29uc3VtZShjb2RlKVxuICAgICAgc2l6ZSsrXG4gICAgICByZXR1cm4gY2xvc2luZ1NlcXVlbmNlXG4gICAgfSAvLyBEb25lIVxuXG4gICAgaWYgKHNpemUgPT09IHNpemVPcGVuKSB7XG4gICAgICBlZmZlY3RzLmV4aXQoJ2NvZGVUZXh0U2VxdWVuY2UnKVxuICAgICAgZWZmZWN0cy5leGl0KCdjb2RlVGV4dCcpXG4gICAgICByZXR1cm4gb2soY29kZSlcbiAgICB9IC8vIE1vcmUgb3IgbGVzcyBhY2NlbnRzOiBtYXJrIGFzIGRhdGEuXG5cbiAgICB0b2tlbi50eXBlID0gJ2NvZGVUZXh0RGF0YSdcbiAgICByZXR1cm4gZGF0YShjb2RlKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29kZVRleHRcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgY29udGVudCA9IHJlcXVpcmUoJy4vaW5pdGlhbGl6ZS9jb250ZW50LmpzJylcbnZhciBkb2N1bWVudCA9IHJlcXVpcmUoJy4vaW5pdGlhbGl6ZS9kb2N1bWVudC5qcycpXG52YXIgZmxvdyA9IHJlcXVpcmUoJy4vaW5pdGlhbGl6ZS9mbG93LmpzJylcbnZhciB0ZXh0ID0gcmVxdWlyZSgnLi9pbml0aWFsaXplL3RleHQuanMnKVxudmFyIGNvbWJpbmVFeHRlbnNpb25zID0gcmVxdWlyZSgnLi91dGlsL2NvbWJpbmUtZXh0ZW5zaW9ucy5qcycpXG52YXIgY3JlYXRlVG9rZW5pemVyID0gcmVxdWlyZSgnLi91dGlsL2NyZWF0ZS10b2tlbml6ZXIuanMnKVxudmFyIG1pbmlmbGF0ID0gcmVxdWlyZSgnLi91dGlsL21pbmlmbGF0LmpzJylcbnZhciBjb25zdHJ1Y3RzID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzLmpzJylcblxuZnVuY3Rpb24gcGFyc2Uob3B0aW9ucykge1xuICB2YXIgc2V0dGluZ3MgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBwYXJzZXIgPSB7XG4gICAgZGVmaW5lZDogW10sXG4gICAgY29uc3RydWN0czogY29tYmluZUV4dGVuc2lvbnMoXG4gICAgICBbY29uc3RydWN0c10uY29uY2F0KG1pbmlmbGF0KHNldHRpbmdzLmV4dGVuc2lvbnMpKVxuICAgICksXG4gICAgY29udGVudDogY3JlYXRlKGNvbnRlbnQpLFxuICAgIGRvY3VtZW50OiBjcmVhdGUoZG9jdW1lbnQpLFxuICAgIGZsb3c6IGNyZWF0ZShmbG93KSxcbiAgICBzdHJpbmc6IGNyZWF0ZSh0ZXh0LnN0cmluZyksXG4gICAgdGV4dDogY3JlYXRlKHRleHQudGV4dClcbiAgfVxuICByZXR1cm4gcGFyc2VyXG5cbiAgZnVuY3Rpb24gY3JlYXRlKGluaXRpYWxpemVyKSB7XG4gICAgcmV0dXJuIGNyZWF0b3JcblxuICAgIGZ1bmN0aW9uIGNyZWF0b3IoZnJvbSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVRva2VuaXplcihwYXJzZXIsIGluaXRpYWxpemVyLCBmcm9tKVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlXG4iLCIndXNlIHN0cmljdCdcblxudmFyIHNlYXJjaCA9IC9bXFwwXFx0XFxuXFxyXS9nXG5cbmZ1bmN0aW9uIHByZXByb2Nlc3MoKSB7XG4gIHZhciBzdGFydCA9IHRydWVcbiAgdmFyIGNvbHVtbiA9IDFcbiAgdmFyIGJ1ZmZlciA9ICcnXG4gIHZhciBhdENhcnJpYWdlUmV0dXJuXG4gIHJldHVybiBwcmVwcm9jZXNzb3JcblxuICBmdW5jdGlvbiBwcmVwcm9jZXNzb3IodmFsdWUsIGVuY29kaW5nLCBlbmQpIHtcbiAgICB2YXIgY2h1bmtzID0gW11cbiAgICB2YXIgbWF0Y2hcbiAgICB2YXIgbmV4dFxuICAgIHZhciBzdGFydFBvc2l0aW9uXG4gICAgdmFyIGVuZFBvc2l0aW9uXG4gICAgdmFyIGNvZGVcbiAgICB2YWx1ZSA9IGJ1ZmZlciArIHZhbHVlLnRvU3RyaW5nKGVuY29kaW5nKVxuICAgIHN0YXJ0UG9zaXRpb24gPSAwXG4gICAgYnVmZmVyID0gJydcblxuICAgIGlmIChzdGFydCkge1xuICAgICAgaWYgKHZhbHVlLmNoYXJDb2RlQXQoMCkgPT09IDY1Mjc5KSB7XG4gICAgICAgIHN0YXJ0UG9zaXRpb24rK1xuICAgICAgfVxuXG4gICAgICBzdGFydCA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIHdoaWxlIChzdGFydFBvc2l0aW9uIDwgdmFsdWUubGVuZ3RoKSB7XG4gICAgICBzZWFyY2gubGFzdEluZGV4ID0gc3RhcnRQb3NpdGlvblxuICAgICAgbWF0Y2ggPSBzZWFyY2guZXhlYyh2YWx1ZSlcbiAgICAgIGVuZFBvc2l0aW9uID0gbWF0Y2ggPyBtYXRjaC5pbmRleCA6IHZhbHVlLmxlbmd0aFxuICAgICAgY29kZSA9IHZhbHVlLmNoYXJDb2RlQXQoZW5kUG9zaXRpb24pXG5cbiAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgYnVmZmVyID0gdmFsdWUuc2xpY2Uoc3RhcnRQb3NpdGlvbilcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvZGUgPT09IDEwICYmIHN0YXJ0UG9zaXRpb24gPT09IGVuZFBvc2l0aW9uICYmIGF0Q2FycmlhZ2VSZXR1cm4pIHtcbiAgICAgICAgY2h1bmtzLnB1c2goLTMpXG4gICAgICAgIGF0Q2FycmlhZ2VSZXR1cm4gPSB1bmRlZmluZWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhdENhcnJpYWdlUmV0dXJuKSB7XG4gICAgICAgICAgY2h1bmtzLnB1c2goLTUpXG4gICAgICAgICAgYXRDYXJyaWFnZVJldHVybiA9IHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YXJ0UG9zaXRpb24gPCBlbmRQb3NpdGlvbikge1xuICAgICAgICAgIGNodW5rcy5wdXNoKHZhbHVlLnNsaWNlKHN0YXJ0UG9zaXRpb24sIGVuZFBvc2l0aW9uKSlcbiAgICAgICAgICBjb2x1bW4gKz0gZW5kUG9zaXRpb24gLSBzdGFydFBvc2l0aW9uXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgIGNodW5rcy5wdXNoKDY1NTMzKVxuICAgICAgICAgIGNvbHVtbisrXG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gOSkge1xuICAgICAgICAgIG5leHQgPSBNYXRoLmNlaWwoY29sdW1uIC8gNCkgKiA0XG4gICAgICAgICAgY2h1bmtzLnB1c2goLTIpXG5cbiAgICAgICAgICB3aGlsZSAoY29sdW1uKysgPCBuZXh0KSBjaHVua3MucHVzaCgtMSlcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSAxMCkge1xuICAgICAgICAgIGNodW5rcy5wdXNoKC00KVxuICAgICAgICAgIGNvbHVtbiA9IDFcbiAgICAgICAgfSAvLyBNdXN0IGJlIGNhcnJpYWdlIHJldHVybi5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgYXRDYXJyaWFnZVJldHVybiA9IHRydWVcbiAgICAgICAgICBjb2x1bW4gPSAxXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc3RhcnRQb3NpdGlvbiA9IGVuZFBvc2l0aW9uICsgMVxuICAgIH1cblxuICAgIGlmIChlbmQpIHtcbiAgICAgIGlmIChhdENhcnJpYWdlUmV0dXJuKSBjaHVua3MucHVzaCgtNSlcbiAgICAgIGlmIChidWZmZXIpIGNodW5rcy5wdXNoKGJ1ZmZlcilcbiAgICAgIGNodW5rcy5wdXNoKG51bGwpXG4gICAgfVxuXG4gICAgcmV0dXJuIGNodW5rc1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJlcHJvY2Vzc1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBzdWJ0b2tlbml6ZSA9IHJlcXVpcmUoJy4vdXRpbC9zdWJ0b2tlbml6ZS5qcycpXG5cbmZ1bmN0aW9uIHBvc3Rwcm9jZXNzKGV2ZW50cykge1xuICB3aGlsZSAoIXN1YnRva2VuaXplKGV2ZW50cykpIHtcbiAgICAvLyBFbXB0eVxuICB9XG5cbiAgcmV0dXJuIGV2ZW50c1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBvc3Rwcm9jZXNzXG4iLCIndXNlIHN0cmljdCdcblxudmFyIG93biA9IHt9Lmhhc093blByb3BlcnR5XG5cbm1vZHVsZS5leHBvcnRzID0gc3RyaW5naWZ5XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeSh2YWx1ZSkge1xuICAvLyBOb3RoaW5nLlxuICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIE5vZGUuXG4gIGlmIChvd24uY2FsbCh2YWx1ZSwgJ3Bvc2l0aW9uJykgfHwgb3duLmNhbGwodmFsdWUsICd0eXBlJykpIHtcbiAgICByZXR1cm4gcG9zaXRpb24odmFsdWUucG9zaXRpb24pXG4gIH1cblxuICAvLyBQb3NpdGlvbi5cbiAgaWYgKG93bi5jYWxsKHZhbHVlLCAnc3RhcnQnKSB8fCBvd24uY2FsbCh2YWx1ZSwgJ2VuZCcpKSB7XG4gICAgcmV0dXJuIHBvc2l0aW9uKHZhbHVlKVxuICB9XG5cbiAgLy8gUG9pbnQuXG4gIGlmIChvd24uY2FsbCh2YWx1ZSwgJ2xpbmUnKSB8fCBvd24uY2FsbCh2YWx1ZSwgJ2NvbHVtbicpKSB7XG4gICAgcmV0dXJuIHBvaW50KHZhbHVlKVxuICB9XG5cbiAgLy8gP1xuICByZXR1cm4gJydcbn1cblxuZnVuY3Rpb24gcG9pbnQocG9pbnQpIHtcbiAgaWYgKCFwb2ludCB8fCB0eXBlb2YgcG9pbnQgIT09ICdvYmplY3QnKSB7XG4gICAgcG9pbnQgPSB7fVxuICB9XG5cbiAgcmV0dXJuIGluZGV4KHBvaW50LmxpbmUpICsgJzonICsgaW5kZXgocG9pbnQuY29sdW1uKVxufVxuXG5mdW5jdGlvbiBwb3NpdGlvbihwb3MpIHtcbiAgaWYgKCFwb3MgfHwgdHlwZW9mIHBvcyAhPT0gJ29iamVjdCcpIHtcbiAgICBwb3MgPSB7fVxuICB9XG5cbiAgcmV0dXJuIHBvaW50KHBvcy5zdGFydCkgKyAnLScgKyBwb2ludChwb3MuZW5kKVxufVxuXG5mdW5jdGlvbiBpbmRleCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/IHZhbHVlIDogMVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gZnJvbU1hcmtkb3duXG5cbi8vIFRoZXNlIHRocmVlIGFyZSBjb21waWxlZCBhd2F5IGluIHRoZSBgZGlzdC9gXG5cbnZhciB0b1N0cmluZyA9IHJlcXVpcmUoJ21kYXN0LXV0aWwtdG8tc3RyaW5nJylcbnZhciBhc3NpZ24gPSByZXF1aXJlKCdtaWNyb21hcmsvZGlzdC9jb25zdGFudC9hc3NpZ24nKVxudmFyIG93biA9IHJlcXVpcmUoJ21pY3JvbWFyay9kaXN0L2NvbnN0YW50L2hhcy1vd24tcHJvcGVydHknKVxudmFyIG5vcm1hbGl6ZUlkZW50aWZpZXIgPSByZXF1aXJlKCdtaWNyb21hcmsvZGlzdC91dGlsL25vcm1hbGl6ZS1pZGVudGlmaWVyJylcbnZhciBzYWZlRnJvbUludCA9IHJlcXVpcmUoJ21pY3JvbWFyay9kaXN0L3V0aWwvc2FmZS1mcm9tLWludCcpXG52YXIgcGFyc2VyID0gcmVxdWlyZSgnbWljcm9tYXJrL2Rpc3QvcGFyc2UnKVxudmFyIHByZXByb2Nlc3NvciA9IHJlcXVpcmUoJ21pY3JvbWFyay9kaXN0L3ByZXByb2Nlc3MnKVxudmFyIHBvc3Rwcm9jZXNzID0gcmVxdWlyZSgnbWljcm9tYXJrL2Rpc3QvcG9zdHByb2Nlc3MnKVxudmFyIGRlY29kZSA9IHJlcXVpcmUoJ3BhcnNlLWVudGl0aWVzL2RlY29kZS1lbnRpdHknKVxudmFyIHN0cmluZ2lmeVBvc2l0aW9uID0gcmVxdWlyZSgndW5pc3QtdXRpbC1zdHJpbmdpZnktcG9zaXRpb24nKVxuXG5mdW5jdGlvbiBmcm9tTWFya2Rvd24odmFsdWUsIGVuY29kaW5nLCBvcHRpb25zKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgb3B0aW9ucyA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSB1bmRlZmluZWRcbiAgfVxuXG4gIHJldHVybiBjb21waWxlcihvcHRpb25zKShcbiAgICBwb3N0cHJvY2VzcyhcbiAgICAgIHBhcnNlcihvcHRpb25zKS5kb2N1bWVudCgpLndyaXRlKHByZXByb2Nlc3NvcigpKHZhbHVlLCBlbmNvZGluZywgdHJ1ZSkpXG4gICAgKVxuICApXG59XG5cbi8vIE5vdGUgdGhpcyBjb21waWxlciBvbmx5IHVuZGVyc3RhbmQgY29tcGxldGUgYnVmZmVyaW5nLCBub3Qgc3RyZWFtaW5nLlxuZnVuY3Rpb24gY29tcGlsZXIob3B0aW9ucykge1xuICB2YXIgc2V0dGluZ3MgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBjb25maWcgPSBjb25maWd1cmUoXG4gICAge1xuICAgICAgdHJhbnNmb3JtczogW10sXG4gICAgICBjYW5Db250YWluRW9sczogW1xuICAgICAgICAnZW1waGFzaXMnLFxuICAgICAgICAnZnJhZ21lbnQnLFxuICAgICAgICAnaGVhZGluZycsXG4gICAgICAgICdwYXJhZ3JhcGgnLFxuICAgICAgICAnc3Ryb25nJ1xuICAgICAgXSxcblxuICAgICAgZW50ZXI6IHtcbiAgICAgICAgYXV0b2xpbms6IG9wZW5lcihsaW5rKSxcbiAgICAgICAgYXV0b2xpbmtQcm90b2NvbDogb25lbnRlcmRhdGEsXG4gICAgICAgIGF1dG9saW5rRW1haWw6IG9uZW50ZXJkYXRhLFxuICAgICAgICBhdHhIZWFkaW5nOiBvcGVuZXIoaGVhZGluZyksXG4gICAgICAgIGJsb2NrUXVvdGU6IG9wZW5lcihibG9ja1F1b3RlKSxcbiAgICAgICAgY2hhcmFjdGVyRXNjYXBlOiBvbmVudGVyZGF0YSxcbiAgICAgICAgY2hhcmFjdGVyUmVmZXJlbmNlOiBvbmVudGVyZGF0YSxcbiAgICAgICAgY29kZUZlbmNlZDogb3BlbmVyKGNvZGVGbG93KSxcbiAgICAgICAgY29kZUZlbmNlZEZlbmNlSW5mbzogYnVmZmVyLFxuICAgICAgICBjb2RlRmVuY2VkRmVuY2VNZXRhOiBidWZmZXIsXG4gICAgICAgIGNvZGVJbmRlbnRlZDogb3BlbmVyKGNvZGVGbG93LCBidWZmZXIpLFxuICAgICAgICBjb2RlVGV4dDogb3BlbmVyKGNvZGVUZXh0LCBidWZmZXIpLFxuICAgICAgICBjb2RlVGV4dERhdGE6IG9uZW50ZXJkYXRhLFxuICAgICAgICBkYXRhOiBvbmVudGVyZGF0YSxcbiAgICAgICAgY29kZUZsb3dWYWx1ZTogb25lbnRlcmRhdGEsXG4gICAgICAgIGRlZmluaXRpb246IG9wZW5lcihkZWZpbml0aW9uKSxcbiAgICAgICAgZGVmaW5pdGlvbkRlc3RpbmF0aW9uU3RyaW5nOiBidWZmZXIsXG4gICAgICAgIGRlZmluaXRpb25MYWJlbFN0cmluZzogYnVmZmVyLFxuICAgICAgICBkZWZpbml0aW9uVGl0bGVTdHJpbmc6IGJ1ZmZlcixcbiAgICAgICAgZW1waGFzaXM6IG9wZW5lcihlbXBoYXNpcyksXG4gICAgICAgIGhhcmRCcmVha0VzY2FwZTogb3BlbmVyKGhhcmRCcmVhayksXG4gICAgICAgIGhhcmRCcmVha1RyYWlsaW5nOiBvcGVuZXIoaGFyZEJyZWFrKSxcbiAgICAgICAgaHRtbEZsb3c6IG9wZW5lcihodG1sLCBidWZmZXIpLFxuICAgICAgICBodG1sRmxvd0RhdGE6IG9uZW50ZXJkYXRhLFxuICAgICAgICBodG1sVGV4dDogb3BlbmVyKGh0bWwsIGJ1ZmZlciksXG4gICAgICAgIGh0bWxUZXh0RGF0YTogb25lbnRlcmRhdGEsXG4gICAgICAgIGltYWdlOiBvcGVuZXIoaW1hZ2UpLFxuICAgICAgICBsYWJlbDogYnVmZmVyLFxuICAgICAgICBsaW5rOiBvcGVuZXIobGluayksXG4gICAgICAgIGxpc3RJdGVtOiBvcGVuZXIobGlzdEl0ZW0pLFxuICAgICAgICBsaXN0SXRlbVZhbHVlOiBvbmVudGVybGlzdGl0ZW12YWx1ZSxcbiAgICAgICAgbGlzdE9yZGVyZWQ6IG9wZW5lcihsaXN0LCBvbmVudGVybGlzdG9yZGVyZWQpLFxuICAgICAgICBsaXN0VW5vcmRlcmVkOiBvcGVuZXIobGlzdCksXG4gICAgICAgIHBhcmFncmFwaDogb3BlbmVyKHBhcmFncmFwaCksXG4gICAgICAgIHJlZmVyZW5jZTogb25lbnRlcnJlZmVyZW5jZSxcbiAgICAgICAgcmVmZXJlbmNlU3RyaW5nOiBidWZmZXIsXG4gICAgICAgIHJlc291cmNlRGVzdGluYXRpb25TdHJpbmc6IGJ1ZmZlcixcbiAgICAgICAgcmVzb3VyY2VUaXRsZVN0cmluZzogYnVmZmVyLFxuICAgICAgICBzZXRleHRIZWFkaW5nOiBvcGVuZXIoaGVhZGluZyksXG4gICAgICAgIHN0cm9uZzogb3BlbmVyKHN0cm9uZyksXG4gICAgICAgIHRoZW1hdGljQnJlYWs6IG9wZW5lcih0aGVtYXRpY0JyZWFrKVxuICAgICAgfSxcblxuICAgICAgZXhpdDoge1xuICAgICAgICBhdHhIZWFkaW5nOiBjbG9zZXIoKSxcbiAgICAgICAgYXR4SGVhZGluZ1NlcXVlbmNlOiBvbmV4aXRhdHhoZWFkaW5nc2VxdWVuY2UsXG4gICAgICAgIGF1dG9saW5rOiBjbG9zZXIoKSxcbiAgICAgICAgYXV0b2xpbmtFbWFpbDogb25leGl0YXV0b2xpbmtlbWFpbCxcbiAgICAgICAgYXV0b2xpbmtQcm90b2NvbDogb25leGl0YXV0b2xpbmtwcm90b2NvbCxcbiAgICAgICAgYmxvY2tRdW90ZTogY2xvc2VyKCksXG4gICAgICAgIGNoYXJhY3RlckVzY2FwZVZhbHVlOiBvbmV4aXRkYXRhLFxuICAgICAgICBjaGFyYWN0ZXJSZWZlcmVuY2VNYXJrZXJIZXhhZGVjaW1hbDogb25leGl0Y2hhcmFjdGVycmVmZXJlbmNlbWFya2VyLFxuICAgICAgICBjaGFyYWN0ZXJSZWZlcmVuY2VNYXJrZXJOdW1lcmljOiBvbmV4aXRjaGFyYWN0ZXJyZWZlcmVuY2VtYXJrZXIsXG4gICAgICAgIGNoYXJhY3RlclJlZmVyZW5jZVZhbHVlOiBvbmV4aXRjaGFyYWN0ZXJyZWZlcmVuY2V2YWx1ZSxcbiAgICAgICAgY29kZUZlbmNlZDogY2xvc2VyKG9uZXhpdGNvZGVmZW5jZWQpLFxuICAgICAgICBjb2RlRmVuY2VkRmVuY2U6IG9uZXhpdGNvZGVmZW5jZWRmZW5jZSxcbiAgICAgICAgY29kZUZlbmNlZEZlbmNlSW5mbzogb25leGl0Y29kZWZlbmNlZGZlbmNlaW5mbyxcbiAgICAgICAgY29kZUZlbmNlZEZlbmNlTWV0YTogb25leGl0Y29kZWZlbmNlZGZlbmNlbWV0YSxcbiAgICAgICAgY29kZUZsb3dWYWx1ZTogb25leGl0ZGF0YSxcbiAgICAgICAgY29kZUluZGVudGVkOiBjbG9zZXIob25leGl0Y29kZWluZGVudGVkKSxcbiAgICAgICAgY29kZVRleHQ6IGNsb3NlcihvbmV4aXRjb2RldGV4dCksXG4gICAgICAgIGNvZGVUZXh0RGF0YTogb25leGl0ZGF0YSxcbiAgICAgICAgZGF0YTogb25leGl0ZGF0YSxcbiAgICAgICAgZGVmaW5pdGlvbjogY2xvc2VyKCksXG4gICAgICAgIGRlZmluaXRpb25EZXN0aW5hdGlvblN0cmluZzogb25leGl0ZGVmaW5pdGlvbmRlc3RpbmF0aW9uc3RyaW5nLFxuICAgICAgICBkZWZpbml0aW9uTGFiZWxTdHJpbmc6IG9uZXhpdGRlZmluaXRpb25sYWJlbHN0cmluZyxcbiAgICAgICAgZGVmaW5pdGlvblRpdGxlU3RyaW5nOiBvbmV4aXRkZWZpbml0aW9udGl0bGVzdHJpbmcsXG4gICAgICAgIGVtcGhhc2lzOiBjbG9zZXIoKSxcbiAgICAgICAgaGFyZEJyZWFrRXNjYXBlOiBjbG9zZXIob25leGl0aGFyZGJyZWFrKSxcbiAgICAgICAgaGFyZEJyZWFrVHJhaWxpbmc6IGNsb3NlcihvbmV4aXRoYXJkYnJlYWspLFxuICAgICAgICBodG1sRmxvdzogY2xvc2VyKG9uZXhpdGh0bWxmbG93KSxcbiAgICAgICAgaHRtbEZsb3dEYXRhOiBvbmV4aXRkYXRhLFxuICAgICAgICBodG1sVGV4dDogY2xvc2VyKG9uZXhpdGh0bWx0ZXh0KSxcbiAgICAgICAgaHRtbFRleHREYXRhOiBvbmV4aXRkYXRhLFxuICAgICAgICBpbWFnZTogY2xvc2VyKG9uZXhpdGltYWdlKSxcbiAgICAgICAgbGFiZWw6IG9uZXhpdGxhYmVsLFxuICAgICAgICBsYWJlbFRleHQ6IG9uZXhpdGxhYmVsdGV4dCxcbiAgICAgICAgbGluZUVuZGluZzogb25leGl0bGluZWVuZGluZyxcbiAgICAgICAgbGluazogY2xvc2VyKG9uZXhpdGxpbmspLFxuICAgICAgICBsaXN0SXRlbTogY2xvc2VyKCksXG4gICAgICAgIGxpc3RPcmRlcmVkOiBjbG9zZXIoKSxcbiAgICAgICAgbGlzdFVub3JkZXJlZDogY2xvc2VyKCksXG4gICAgICAgIHBhcmFncmFwaDogY2xvc2VyKCksXG4gICAgICAgIHJlZmVyZW5jZVN0cmluZzogb25leGl0cmVmZXJlbmNlc3RyaW5nLFxuICAgICAgICByZXNvdXJjZURlc3RpbmF0aW9uU3RyaW5nOiBvbmV4aXRyZXNvdXJjZWRlc3RpbmF0aW9uc3RyaW5nLFxuICAgICAgICByZXNvdXJjZVRpdGxlU3RyaW5nOiBvbmV4aXRyZXNvdXJjZXRpdGxlc3RyaW5nLFxuICAgICAgICByZXNvdXJjZTogb25leGl0cmVzb3VyY2UsXG4gICAgICAgIHNldGV4dEhlYWRpbmc6IGNsb3NlcihvbmV4aXRzZXRleHRoZWFkaW5nKSxcbiAgICAgICAgc2V0ZXh0SGVhZGluZ0xpbmVTZXF1ZW5jZTogb25leGl0c2V0ZXh0aGVhZGluZ2xpbmVzZXF1ZW5jZSxcbiAgICAgICAgc2V0ZXh0SGVhZGluZ1RleHQ6IG9uZXhpdHNldGV4dGhlYWRpbmd0ZXh0LFxuICAgICAgICBzdHJvbmc6IGNsb3NlcigpLFxuICAgICAgICB0aGVtYXRpY0JyZWFrOiBjbG9zZXIoKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXR0aW5ncy5tZGFzdEV4dGVuc2lvbnMgfHwgW11cbiAgKVxuXG4gIHZhciBkYXRhID0ge31cblxuICByZXR1cm4gY29tcGlsZVxuXG4gIGZ1bmN0aW9uIGNvbXBpbGUoZXZlbnRzKSB7XG4gICAgdmFyIHRyZWUgPSB7dHlwZTogJ3Jvb3QnLCBjaGlsZHJlbjogW119XG4gICAgdmFyIHN0YWNrID0gW3RyZWVdXG4gICAgdmFyIHRva2VuU3RhY2sgPSBbXVxuICAgIHZhciBsaXN0U3RhY2sgPSBbXVxuICAgIHZhciBpbmRleCA9IC0xXG4gICAgdmFyIGhhbmRsZXJcbiAgICB2YXIgbGlzdFN0YXJ0XG5cbiAgICB2YXIgY29udGV4dCA9IHtcbiAgICAgIHN0YWNrOiBzdGFjayxcbiAgICAgIHRva2VuU3RhY2s6IHRva2VuU3RhY2ssXG4gICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgIGVudGVyOiBlbnRlcixcbiAgICAgIGV4aXQ6IGV4aXQsXG4gICAgICBidWZmZXI6IGJ1ZmZlcixcbiAgICAgIHJlc3VtZTogcmVzdW1lLFxuICAgICAgc2V0RGF0YTogc2V0RGF0YSxcbiAgICAgIGdldERhdGE6IGdldERhdGFcbiAgICB9XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGV2ZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIFdlIHByZXByb2Nlc3MgbGlzdHMgdG8gYWRkIGBsaXN0SXRlbWAgdG9rZW5zLCBhbmQgdG8gaW5mZXIgd2hldGhlclxuICAgICAgLy8gaXRlbXMgdGhlIGxpc3QgaXRzZWxmIGFyZSBzcHJlYWQgb3V0LlxuICAgICAgaWYgKFxuICAgICAgICBldmVudHNbaW5kZXhdWzFdLnR5cGUgPT09ICdsaXN0T3JkZXJlZCcgfHxcbiAgICAgICAgZXZlbnRzW2luZGV4XVsxXS50eXBlID09PSAnbGlzdFVub3JkZXJlZCdcbiAgICAgICkge1xuICAgICAgICBpZiAoZXZlbnRzW2luZGV4XVswXSA9PT0gJ2VudGVyJykge1xuICAgICAgICAgIGxpc3RTdGFjay5wdXNoKGluZGV4KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpc3RTdGFydCA9IGxpc3RTdGFjay5wb3AoaW5kZXgpXG4gICAgICAgICAgaW5kZXggPSBwcmVwYXJlTGlzdChldmVudHMsIGxpc3RTdGFydCwgaW5kZXgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpbmRleCA9IC0xXG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGV2ZW50cy5sZW5ndGgpIHtcbiAgICAgIGhhbmRsZXIgPSBjb25maWdbZXZlbnRzW2luZGV4XVswXV1cblxuICAgICAgaWYgKG93bi5jYWxsKGhhbmRsZXIsIGV2ZW50c1tpbmRleF1bMV0udHlwZSkpIHtcbiAgICAgICAgaGFuZGxlcltldmVudHNbaW5kZXhdWzFdLnR5cGVdLmNhbGwoXG4gICAgICAgICAgYXNzaWduKHtzbGljZVNlcmlhbGl6ZTogZXZlbnRzW2luZGV4XVsyXS5zbGljZVNlcmlhbGl6ZX0sIGNvbnRleHQpLFxuICAgICAgICAgIGV2ZW50c1tpbmRleF1bMV1cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0b2tlblN0YWNrLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2Fubm90IGNsb3NlIGRvY3VtZW50LCBhIHRva2VuIChgJyArXG4gICAgICAgICAgdG9rZW5TdGFja1t0b2tlblN0YWNrLmxlbmd0aCAtIDFdLnR5cGUgK1xuICAgICAgICAgICdgLCAnICtcbiAgICAgICAgICBzdHJpbmdpZnlQb3NpdGlvbih7XG4gICAgICAgICAgICBzdGFydDogdG9rZW5TdGFja1t0b2tlblN0YWNrLmxlbmd0aCAtIDFdLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiB0b2tlblN0YWNrW3Rva2VuU3RhY2subGVuZ3RoIC0gMV0uZW5kXG4gICAgICAgICAgfSkgK1xuICAgICAgICAgICcpIGlzIHN0aWxsIG9wZW4nXG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gRmlndXJlIG91dCBgcm9vdGAgcG9zaXRpb24uXG4gICAgdHJlZS5wb3NpdGlvbiA9IHtcbiAgICAgIHN0YXJ0OiBwb2ludChcbiAgICAgICAgZXZlbnRzLmxlbmd0aCA/IGV2ZW50c1swXVsxXS5zdGFydCA6IHtsaW5lOiAxLCBjb2x1bW46IDEsIG9mZnNldDogMH1cbiAgICAgICksXG5cbiAgICAgIGVuZDogcG9pbnQoXG4gICAgICAgIGV2ZW50cy5sZW5ndGhcbiAgICAgICAgICA/IGV2ZW50c1tldmVudHMubGVuZ3RoIC0gMl1bMV0uZW5kXG4gICAgICAgICAgOiB7bGluZTogMSwgY29sdW1uOiAxLCBvZmZzZXQ6IDB9XG4gICAgICApXG4gICAgfVxuXG4gICAgaW5kZXggPSAtMVxuICAgIHdoaWxlICgrK2luZGV4IDwgY29uZmlnLnRyYW5zZm9ybXMubGVuZ3RoKSB7XG4gICAgICB0cmVlID0gY29uZmlnLnRyYW5zZm9ybXNbaW5kZXhdKHRyZWUpIHx8IHRyZWVcbiAgICB9XG5cbiAgICByZXR1cm4gdHJlZVxuICB9XG5cbiAgZnVuY3Rpb24gcHJlcGFyZUxpc3QoZXZlbnRzLCBzdGFydCwgbGVuZ3RoKSB7XG4gICAgdmFyIGluZGV4ID0gc3RhcnQgLSAxXG4gICAgdmFyIGNvbnRhaW5lckJhbGFuY2UgPSAtMVxuICAgIHZhciBsaXN0U3ByZWFkID0gZmFsc2VcbiAgICB2YXIgbGlzdEl0ZW1cbiAgICB2YXIgdGFpbEluZGV4XG4gICAgdmFyIGxpbmVJbmRleFxuICAgIHZhciB0YWlsRXZlbnRcbiAgICB2YXIgZXZlbnRcbiAgICB2YXIgZmlyc3RCbGFua0xpbmVJbmRleFxuICAgIHZhciBhdE1hcmtlclxuXG4gICAgd2hpbGUgKCsraW5kZXggPD0gbGVuZ3RoKSB7XG4gICAgICBldmVudCA9IGV2ZW50c1tpbmRleF1cblxuICAgICAgaWYgKFxuICAgICAgICBldmVudFsxXS50eXBlID09PSAnbGlzdFVub3JkZXJlZCcgfHxcbiAgICAgICAgZXZlbnRbMV0udHlwZSA9PT0gJ2xpc3RPcmRlcmVkJyB8fFxuICAgICAgICBldmVudFsxXS50eXBlID09PSAnYmxvY2tRdW90ZSdcbiAgICAgICkge1xuICAgICAgICBpZiAoZXZlbnRbMF0gPT09ICdlbnRlcicpIHtcbiAgICAgICAgICBjb250YWluZXJCYWxhbmNlKytcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb250YWluZXJCYWxhbmNlLS1cbiAgICAgICAgfVxuXG4gICAgICAgIGF0TWFya2VyID0gdW5kZWZpbmVkXG4gICAgICB9IGVsc2UgaWYgKGV2ZW50WzFdLnR5cGUgPT09ICdsaW5lRW5kaW5nQmxhbmsnKSB7XG4gICAgICAgIGlmIChldmVudFswXSA9PT0gJ2VudGVyJykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGxpc3RJdGVtICYmXG4gICAgICAgICAgICAhYXRNYXJrZXIgJiZcbiAgICAgICAgICAgICFjb250YWluZXJCYWxhbmNlICYmXG4gICAgICAgICAgICAhZmlyc3RCbGFua0xpbmVJbmRleFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgZmlyc3RCbGFua0xpbmVJbmRleCA9IGluZGV4XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXRNYXJrZXIgPSB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgZXZlbnRbMV0udHlwZSA9PT0gJ2xpbmVQcmVmaXgnIHx8XG4gICAgICAgIGV2ZW50WzFdLnR5cGUgPT09ICdsaXN0SXRlbVZhbHVlJyB8fFxuICAgICAgICBldmVudFsxXS50eXBlID09PSAnbGlzdEl0ZW1NYXJrZXInIHx8XG4gICAgICAgIGV2ZW50WzFdLnR5cGUgPT09ICdsaXN0SXRlbVByZWZpeCcgfHxcbiAgICAgICAgZXZlbnRbMV0udHlwZSA9PT0gJ2xpc3RJdGVtUHJlZml4V2hpdGVzcGFjZSdcbiAgICAgICkge1xuICAgICAgICAvLyBFbXB0eS5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0TWFya2VyID0gdW5kZWZpbmVkXG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgKCFjb250YWluZXJCYWxhbmNlICYmXG4gICAgICAgICAgZXZlbnRbMF0gPT09ICdlbnRlcicgJiZcbiAgICAgICAgICBldmVudFsxXS50eXBlID09PSAnbGlzdEl0ZW1QcmVmaXgnKSB8fFxuICAgICAgICAoY29udGFpbmVyQmFsYW5jZSA9PT0gLTEgJiZcbiAgICAgICAgICBldmVudFswXSA9PT0gJ2V4aXQnICYmXG4gICAgICAgICAgKGV2ZW50WzFdLnR5cGUgPT09ICdsaXN0VW5vcmRlcmVkJyB8fFxuICAgICAgICAgICAgZXZlbnRbMV0udHlwZSA9PT0gJ2xpc3RPcmRlcmVkJykpXG4gICAgICApIHtcbiAgICAgICAgaWYgKGxpc3RJdGVtKSB7XG4gICAgICAgICAgdGFpbEluZGV4ID0gaW5kZXhcbiAgICAgICAgICBsaW5lSW5kZXggPSB1bmRlZmluZWRcblxuICAgICAgICAgIHdoaWxlICh0YWlsSW5kZXgtLSkge1xuICAgICAgICAgICAgdGFpbEV2ZW50ID0gZXZlbnRzW3RhaWxJbmRleF1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0YWlsRXZlbnRbMV0udHlwZSA9PT0gJ2xpbmVFbmRpbmcnIHx8XG4gICAgICAgICAgICAgIHRhaWxFdmVudFsxXS50eXBlID09PSAnbGluZUVuZGluZ0JsYW5rJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlmICh0YWlsRXZlbnRbMF0gPT09ICdleGl0JykgY29udGludWVcblxuICAgICAgICAgICAgICBpZiAobGluZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzW2xpbmVJbmRleF1bMV0udHlwZSA9ICdsaW5lRW5kaW5nQmxhbmsnXG4gICAgICAgICAgICAgICAgbGlzdFNwcmVhZCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRhaWxFdmVudFsxXS50eXBlID0gJ2xpbmVFbmRpbmcnXG4gICAgICAgICAgICAgIGxpbmVJbmRleCA9IHRhaWxJbmRleFxuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgdGFpbEV2ZW50WzFdLnR5cGUgPT09ICdsaW5lUHJlZml4JyB8fFxuICAgICAgICAgICAgICB0YWlsRXZlbnRbMV0udHlwZSA9PT0gJ2Jsb2NrUXVvdGVQcmVmaXgnIHx8XG4gICAgICAgICAgICAgIHRhaWxFdmVudFsxXS50eXBlID09PSAnYmxvY2tRdW90ZVByZWZpeFdoaXRlc3BhY2UnIHx8XG4gICAgICAgICAgICAgIHRhaWxFdmVudFsxXS50eXBlID09PSAnYmxvY2tRdW90ZU1hcmtlcicgfHxcbiAgICAgICAgICAgICAgdGFpbEV2ZW50WzFdLnR5cGUgPT09ICdsaXN0SXRlbUluZGVudCdcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAvLyBFbXB0eVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBmaXJzdEJsYW5rTGluZUluZGV4ICYmXG4gICAgICAgICAgICAoIWxpbmVJbmRleCB8fCBmaXJzdEJsYW5rTGluZUluZGV4IDwgbGluZUluZGV4KVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgbGlzdEl0ZW0uX3NwcmVhZCA9IHRydWVcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBGaXggcG9zaXRpb24uXG4gICAgICAgICAgbGlzdEl0ZW0uZW5kID0gcG9pbnQoXG4gICAgICAgICAgICBsaW5lSW5kZXggPyBldmVudHNbbGluZUluZGV4XVsxXS5zdGFydCA6IGV2ZW50WzFdLmVuZFxuICAgICAgICAgIClcblxuICAgICAgICAgIGV2ZW50cy5zcGxpY2UobGluZUluZGV4IHx8IGluZGV4LCAwLCBbJ2V4aXQnLCBsaXN0SXRlbSwgZXZlbnRbMl1dKVxuICAgICAgICAgIGluZGV4KytcbiAgICAgICAgICBsZW5ndGgrK1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGxpc3QgaXRlbS5cbiAgICAgICAgaWYgKGV2ZW50WzFdLnR5cGUgPT09ICdsaXN0SXRlbVByZWZpeCcpIHtcbiAgICAgICAgICBsaXN0SXRlbSA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdsaXN0SXRlbScsXG4gICAgICAgICAgICBfc3ByZWFkOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXJ0OiBwb2ludChldmVudFsxXS5zdGFydClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBldmVudHMuc3BsaWNlKGluZGV4LCAwLCBbJ2VudGVyJywgbGlzdEl0ZW0sIGV2ZW50WzJdXSlcbiAgICAgICAgICBpbmRleCsrXG4gICAgICAgICAgbGVuZ3RoKytcbiAgICAgICAgICBmaXJzdEJsYW5rTGluZUluZGV4ID0gdW5kZWZpbmVkXG4gICAgICAgICAgYXRNYXJrZXIgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBldmVudHNbc3RhcnRdWzFdLl9zcHJlYWQgPSBsaXN0U3ByZWFkXG4gICAgcmV0dXJuIGxlbmd0aFxuICB9XG5cbiAgZnVuY3Rpb24gc2V0RGF0YShrZXksIHZhbHVlKSB7XG4gICAgZGF0YVtrZXldID0gdmFsdWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldERhdGEoa2V5KSB7XG4gICAgcmV0dXJuIGRhdGFba2V5XVxuICB9XG5cbiAgZnVuY3Rpb24gcG9pbnQoZCkge1xuICAgIHJldHVybiB7bGluZTogZC5saW5lLCBjb2x1bW46IGQuY29sdW1uLCBvZmZzZXQ6IGQub2Zmc2V0fVxuICB9XG5cbiAgZnVuY3Rpb24gb3BlbmVyKGNyZWF0ZSwgYW5kKSB7XG4gICAgcmV0dXJuIG9wZW5cblxuICAgIGZ1bmN0aW9uIG9wZW4odG9rZW4pIHtcbiAgICAgIGVudGVyLmNhbGwodGhpcywgY3JlYXRlKHRva2VuKSwgdG9rZW4pXG4gICAgICBpZiAoYW5kKSBhbmQuY2FsbCh0aGlzLCB0b2tlbilcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBidWZmZXIoKSB7XG4gICAgdGhpcy5zdGFjay5wdXNoKHt0eXBlOiAnZnJhZ21lbnQnLCBjaGlsZHJlbjogW119KVxuICB9XG5cbiAgZnVuY3Rpb24gZW50ZXIobm9kZSwgdG9rZW4pIHtcbiAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0uY2hpbGRyZW4ucHVzaChub2RlKVxuICAgIHRoaXMuc3RhY2sucHVzaChub2RlKVxuICAgIHRoaXMudG9rZW5TdGFjay5wdXNoKHRva2VuKVxuICAgIG5vZGUucG9zaXRpb24gPSB7c3RhcnQ6IHBvaW50KHRva2VuLnN0YXJ0KX1cbiAgICByZXR1cm4gbm9kZVxuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VyKGFuZCkge1xuICAgIHJldHVybiBjbG9zZVxuXG4gICAgZnVuY3Rpb24gY2xvc2UodG9rZW4pIHtcbiAgICAgIGlmIChhbmQpIGFuZC5jYWxsKHRoaXMsIHRva2VuKVxuICAgICAgZXhpdC5jYWxsKHRoaXMsIHRva2VuKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGV4aXQodG9rZW4pIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuc3RhY2sucG9wKClcbiAgICB2YXIgb3BlbiA9IHRoaXMudG9rZW5TdGFjay5wb3AoKVxuXG4gICAgaWYgKCFvcGVuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDYW5ub3QgY2xvc2UgYCcgK1xuICAgICAgICAgIHRva2VuLnR5cGUgK1xuICAgICAgICAgICdgICgnICtcbiAgICAgICAgICBzdHJpbmdpZnlQb3NpdGlvbih7c3RhcnQ6IHRva2VuLnN0YXJ0LCBlbmQ6IHRva2VuLmVuZH0pICtcbiAgICAgICAgICAnKTogaXTigJlzIG5vdCBvcGVuJ1xuICAgICAgKVxuICAgIH0gZWxzZSBpZiAob3Blbi50eXBlICE9PSB0b2tlbi50eXBlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDYW5ub3QgY2xvc2UgYCcgK1xuICAgICAgICAgIHRva2VuLnR5cGUgK1xuICAgICAgICAgICdgICgnICtcbiAgICAgICAgICBzdHJpbmdpZnlQb3NpdGlvbih7c3RhcnQ6IHRva2VuLnN0YXJ0LCBlbmQ6IHRva2VuLmVuZH0pICtcbiAgICAgICAgICAnKTogYSBkaWZmZXJlbnQgdG9rZW4gKGAnICtcbiAgICAgICAgICBvcGVuLnR5cGUgK1xuICAgICAgICAgICdgLCAnICtcbiAgICAgICAgICBzdHJpbmdpZnlQb3NpdGlvbih7c3RhcnQ6IG9wZW4uc3RhcnQsIGVuZDogb3Blbi5lbmR9KSArXG4gICAgICAgICAgJykgaXMgb3BlbidcbiAgICAgIClcbiAgICB9XG5cbiAgICBub2RlLnBvc2l0aW9uLmVuZCA9IHBvaW50KHRva2VuLmVuZClcbiAgICByZXR1cm4gbm9kZVxuICB9XG5cbiAgZnVuY3Rpb24gcmVzdW1lKCkge1xuICAgIHJldHVybiB0b1N0cmluZyh0aGlzLnN0YWNrLnBvcCgpKVxuICB9XG5cbiAgLy9cbiAgLy8gSGFuZGxlcnMuXG4gIC8vXG5cbiAgZnVuY3Rpb24gb25lbnRlcmxpc3RvcmRlcmVkKCkge1xuICAgIHNldERhdGEoJ2V4cGVjdGluZ0ZpcnN0TGlzdEl0ZW1WYWx1ZScsIHRydWUpXG4gIH1cblxuICBmdW5jdGlvbiBvbmVudGVybGlzdGl0ZW12YWx1ZSh0b2tlbikge1xuICAgIGlmIChnZXREYXRhKCdleHBlY3RpbmdGaXJzdExpc3RJdGVtVmFsdWUnKSkge1xuICAgICAgdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDJdLnN0YXJ0ID0gcGFyc2VJbnQoXG4gICAgICAgIHRoaXMuc2xpY2VTZXJpYWxpemUodG9rZW4pLFxuICAgICAgICAxMFxuICAgICAgKVxuXG4gICAgICBzZXREYXRhKCdleHBlY3RpbmdGaXJzdExpc3RJdGVtVmFsdWUnKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGNvZGVmZW5jZWRmZW5jZWluZm8oKSB7XG4gICAgdmFyIGRhdGEgPSB0aGlzLnJlc3VtZSgpXG4gICAgdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLmxhbmcgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRjb2RlZmVuY2VkZmVuY2VtZXRhKCkge1xuICAgIHZhciBkYXRhID0gdGhpcy5yZXN1bWUoKVxuICAgIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAxXS5tZXRhID0gZGF0YVxuICB9XG5cbiAgZnVuY3Rpb24gb25leGl0Y29kZWZlbmNlZGZlbmNlKCkge1xuICAgIC8vIEV4aXQgaWYgdGhpcyBpcyB0aGUgY2xvc2luZyBmZW5jZS5cbiAgICBpZiAoZ2V0RGF0YSgnZmxvd0NvZGVJbnNpZGUnKSkgcmV0dXJuXG4gICAgdGhpcy5idWZmZXIoKVxuICAgIHNldERhdGEoJ2Zsb3dDb2RlSW5zaWRlJywgdHJ1ZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGNvZGVmZW5jZWQoKSB7XG4gICAgdmFyIGRhdGEgPSB0aGlzLnJlc3VtZSgpXG4gICAgdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLnZhbHVlID0gZGF0YS5yZXBsYWNlKFxuICAgICAgL14oXFxyP1xcbnxcXHIpfChcXHI/XFxufFxccikkL2csXG4gICAgICAnJ1xuICAgIClcblxuICAgIHNldERhdGEoJ2Zsb3dDb2RlSW5zaWRlJylcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGNvZGVpbmRlbnRlZCgpIHtcbiAgICB2YXIgZGF0YSA9IHRoaXMucmVzdW1lKClcbiAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0udmFsdWUgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRkZWZpbml0aW9ubGFiZWxzdHJpbmcodG9rZW4pIHtcbiAgICAvLyBEaXNjYXJkIGxhYmVsLCB1c2UgdGhlIHNvdXJjZSBjb250ZW50IGluc3RlYWQuXG4gICAgdmFyIGxhYmVsID0gdGhpcy5yZXN1bWUoKVxuICAgIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAxXS5sYWJlbCA9IGxhYmVsXG4gICAgdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLmlkZW50aWZpZXIgPSBub3JtYWxpemVJZGVudGlmaWVyKFxuICAgICAgdGhpcy5zbGljZVNlcmlhbGl6ZSh0b2tlbilcbiAgICApLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGRlZmluaXRpb250aXRsZXN0cmluZygpIHtcbiAgICB2YXIgZGF0YSA9IHRoaXMucmVzdW1lKClcbiAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0udGl0bGUgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRkZWZpbml0aW9uZGVzdGluYXRpb25zdHJpbmcoKSB7XG4gICAgdmFyIGRhdGEgPSB0aGlzLnJlc3VtZSgpXG4gICAgdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLnVybCA9IGRhdGFcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGF0eGhlYWRpbmdzZXF1ZW5jZSh0b2tlbikge1xuICAgIGlmICghdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLmRlcHRoKSB7XG4gICAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0uZGVwdGggPSB0aGlzLnNsaWNlU2VyaWFsaXplKFxuICAgICAgICB0b2tlblxuICAgICAgKS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRzZXRleHRoZWFkaW5ndGV4dCgpIHtcbiAgICBzZXREYXRhKCdzZXRleHRIZWFkaW5nU2x1cnBMaW5lRW5kaW5nJywgdHJ1ZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdHNldGV4dGhlYWRpbmdsaW5lc2VxdWVuY2UodG9rZW4pIHtcbiAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0uZGVwdGggPVxuICAgICAgdGhpcy5zbGljZVNlcmlhbGl6ZSh0b2tlbikuY2hhckNvZGVBdCgwKSA9PT0gNjEgPyAxIDogMlxuICB9XG5cbiAgZnVuY3Rpb24gb25leGl0c2V0ZXh0aGVhZGluZygpIHtcbiAgICBzZXREYXRhKCdzZXRleHRIZWFkaW5nU2x1cnBMaW5lRW5kaW5nJylcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZW50ZXJkYXRhKHRva2VuKSB7XG4gICAgdmFyIHNpYmxpbmdzID0gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLmNoaWxkcmVuXG4gICAgdmFyIHRhaWwgPSBzaWJsaW5nc1tzaWJsaW5ncy5sZW5ndGggLSAxXVxuXG4gICAgaWYgKCF0YWlsIHx8IHRhaWwudHlwZSAhPT0gJ3RleHQnKSB7XG4gICAgICAvLyBBZGQgYSBuZXcgdGV4dCBub2RlLlxuICAgICAgdGFpbCA9IHRleHQoKVxuICAgICAgdGFpbC5wb3NpdGlvbiA9IHtzdGFydDogcG9pbnQodG9rZW4uc3RhcnQpfVxuICAgICAgdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLmNoaWxkcmVuLnB1c2godGFpbClcbiAgICB9XG5cbiAgICB0aGlzLnN0YWNrLnB1c2godGFpbClcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGRhdGEodG9rZW4pIHtcbiAgICB2YXIgdGFpbCA9IHRoaXMuc3RhY2sucG9wKClcbiAgICB0YWlsLnZhbHVlICs9IHRoaXMuc2xpY2VTZXJpYWxpemUodG9rZW4pXG4gICAgdGFpbC5wb3NpdGlvbi5lbmQgPSBwb2ludCh0b2tlbi5lbmQpXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRsaW5lZW5kaW5nKHRva2VuKSB7XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV1cblxuICAgIC8vIElmIHdl4oCZcmUgYXQgYSBoYXJkIGJyZWFrLCBpbmNsdWRlIHRoZSBsaW5lIGVuZGluZyBpbiB0aGVyZS5cbiAgICBpZiAoZ2V0RGF0YSgnYXRIYXJkQnJlYWsnKSkge1xuICAgICAgY29udGV4dC5jaGlsZHJlbltjb250ZXh0LmNoaWxkcmVuLmxlbmd0aCAtIDFdLnBvc2l0aW9uLmVuZCA9IHBvaW50KFxuICAgICAgICB0b2tlbi5lbmRcbiAgICAgIClcblxuICAgICAgc2V0RGF0YSgnYXRIYXJkQnJlYWsnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgIWdldERhdGEoJ3NldGV4dEhlYWRpbmdTbHVycExpbmVFbmRpbmcnKSAmJlxuICAgICAgY29uZmlnLmNhbkNvbnRhaW5Fb2xzLmluZGV4T2YoY29udGV4dC50eXBlKSA+IC0xXG4gICAgKSB7XG4gICAgICBvbmVudGVyZGF0YS5jYWxsKHRoaXMsIHRva2VuKVxuICAgICAgb25leGl0ZGF0YS5jYWxsKHRoaXMsIHRva2VuKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGhhcmRicmVhaygpIHtcbiAgICBzZXREYXRhKCdhdEhhcmRCcmVhaycsIHRydWUpXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRodG1sZmxvdygpIHtcbiAgICB2YXIgZGF0YSA9IHRoaXMucmVzdW1lKClcbiAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0udmFsdWUgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRodG1sdGV4dCgpIHtcbiAgICB2YXIgZGF0YSA9IHRoaXMucmVzdW1lKClcbiAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0udmFsdWUgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRjb2RldGV4dCgpIHtcbiAgICB2YXIgZGF0YSA9IHRoaXMucmVzdW1lKClcbiAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0udmFsdWUgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRsaW5rKCkge1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdXG5cbiAgICAvLyBUbyBkbzogY2xlYW4uXG4gICAgaWYgKGdldERhdGEoJ2luUmVmZXJlbmNlJykpIHtcbiAgICAgIGNvbnRleHQudHlwZSArPSAnUmVmZXJlbmNlJ1xuICAgICAgY29udGV4dC5yZWZlcmVuY2VUeXBlID0gZ2V0RGF0YSgncmVmZXJlbmNlVHlwZScpIHx8ICdzaG9ydGN1dCdcbiAgICAgIGRlbGV0ZSBjb250ZXh0LnVybFxuICAgICAgZGVsZXRlIGNvbnRleHQudGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvbnRleHQuaWRlbnRpZmllclxuICAgICAgZGVsZXRlIGNvbnRleHQubGFiZWxcbiAgICAgIGRlbGV0ZSBjb250ZXh0LnJlZmVyZW5jZVR5cGVcbiAgICB9XG5cbiAgICBzZXREYXRhKCdyZWZlcmVuY2VUeXBlJylcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGltYWdlKCkge1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdXG5cbiAgICAvLyBUbyBkbzogY2xlYW4uXG4gICAgaWYgKGdldERhdGEoJ2luUmVmZXJlbmNlJykpIHtcbiAgICAgIGNvbnRleHQudHlwZSArPSAnUmVmZXJlbmNlJ1xuICAgICAgY29udGV4dC5yZWZlcmVuY2VUeXBlID0gZ2V0RGF0YSgncmVmZXJlbmNlVHlwZScpIHx8ICdzaG9ydGN1dCdcbiAgICAgIGRlbGV0ZSBjb250ZXh0LnVybFxuICAgICAgZGVsZXRlIGNvbnRleHQudGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvbnRleHQuaWRlbnRpZmllclxuICAgICAgZGVsZXRlIGNvbnRleHQubGFiZWxcbiAgICAgIGRlbGV0ZSBjb250ZXh0LnJlZmVyZW5jZVR5cGVcbiAgICB9XG5cbiAgICBzZXREYXRhKCdyZWZlcmVuY2VUeXBlJylcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGxhYmVsdGV4dCh0b2tlbikge1xuICAgIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAyXS5pZGVudGlmaWVyID0gbm9ybWFsaXplSWRlbnRpZmllcihcbiAgICAgIHRoaXMuc2xpY2VTZXJpYWxpemUodG9rZW4pXG4gICAgKS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRsYWJlbCgpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV1cbiAgICB2YXIgdmFsdWUgPSB0aGlzLnJlc3VtZSgpXG5cbiAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0ubGFiZWwgPSB2YWx1ZVxuXG4gICAgLy8gQXNzdW1lIGEgcmVmZXJlbmNlLlxuICAgIHNldERhdGEoJ2luUmVmZXJlbmNlJywgdHJ1ZSlcblxuICAgIGlmICh0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0udHlwZSA9PT0gJ2xpbmsnKSB7XG4gICAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0uY2hpbGRyZW4gPSBmcmFnbWVudC5jaGlsZHJlblxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YWNrW3RoaXMuc3RhY2subGVuZ3RoIC0gMV0uYWx0ID0gdmFsdWVcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRyZXNvdXJjZWRlc3RpbmF0aW9uc3RyaW5nKCkge1xuICAgIHZhciBkYXRhID0gdGhpcy5yZXN1bWUoKVxuICAgIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAxXS51cmwgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRyZXNvdXJjZXRpdGxlc3RyaW5nKCkge1xuICAgIHZhciBkYXRhID0gdGhpcy5yZXN1bWUoKVxuICAgIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAxXS50aXRsZSA9IGRhdGFcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdHJlc291cmNlKCkge1xuICAgIHNldERhdGEoJ2luUmVmZXJlbmNlJylcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZW50ZXJyZWZlcmVuY2UoKSB7XG4gICAgc2V0RGF0YSgncmVmZXJlbmNlVHlwZScsICdjb2xsYXBzZWQnKVxuICB9XG5cbiAgZnVuY3Rpb24gb25leGl0cmVmZXJlbmNlc3RyaW5nKHRva2VuKSB7XG4gICAgdmFyIGxhYmVsID0gdGhpcy5yZXN1bWUoKVxuICAgIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAxXS5sYWJlbCA9IGxhYmVsXG4gICAgdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLmlkZW50aWZpZXIgPSBub3JtYWxpemVJZGVudGlmaWVyKFxuICAgICAgdGhpcy5zbGljZVNlcmlhbGl6ZSh0b2tlbilcbiAgICApLnRvTG93ZXJDYXNlKClcbiAgICBzZXREYXRhKCdyZWZlcmVuY2VUeXBlJywgJ2Z1bGwnKVxuICB9XG5cbiAgZnVuY3Rpb24gb25leGl0Y2hhcmFjdGVycmVmZXJlbmNlbWFya2VyKHRva2VuKSB7XG4gICAgc2V0RGF0YSgnY2hhcmFjdGVyUmVmZXJlbmNlVHlwZScsIHRva2VuLnR5cGUpXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRjaGFyYWN0ZXJyZWZlcmVuY2V2YWx1ZSh0b2tlbikge1xuICAgIHZhciBkYXRhID0gdGhpcy5zbGljZVNlcmlhbGl6ZSh0b2tlbilcbiAgICB2YXIgdHlwZSA9IGdldERhdGEoJ2NoYXJhY3RlclJlZmVyZW5jZVR5cGUnKVxuICAgIHZhciB2YWx1ZVxuICAgIHZhciB0YWlsXG5cbiAgICBpZiAodHlwZSkge1xuICAgICAgdmFsdWUgPSBzYWZlRnJvbUludChcbiAgICAgICAgZGF0YSxcbiAgICAgICAgdHlwZSA9PT0gJ2NoYXJhY3RlclJlZmVyZW5jZU1hcmtlck51bWVyaWMnID8gMTAgOiAxNlxuICAgICAgKVxuXG4gICAgICBzZXREYXRhKCdjaGFyYWN0ZXJSZWZlcmVuY2VUeXBlJylcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBkZWNvZGUoZGF0YSlcbiAgICB9XG5cbiAgICB0YWlsID0gdGhpcy5zdGFjay5wb3AoKVxuICAgIHRhaWwudmFsdWUgKz0gdmFsdWVcbiAgICB0YWlsLnBvc2l0aW9uLmVuZCA9IHBvaW50KHRva2VuLmVuZClcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZXhpdGF1dG9saW5rcHJvdG9jb2wodG9rZW4pIHtcbiAgICBvbmV4aXRkYXRhLmNhbGwodGhpcywgdG9rZW4pXG4gICAgdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdLnVybCA9IHRoaXMuc2xpY2VTZXJpYWxpemUodG9rZW4pXG4gIH1cblxuICBmdW5jdGlvbiBvbmV4aXRhdXRvbGlua2VtYWlsKHRva2VuKSB7XG4gICAgb25leGl0ZGF0YS5jYWxsKHRoaXMsIHRva2VuKVxuICAgIHRoaXMuc3RhY2tbdGhpcy5zdGFjay5sZW5ndGggLSAxXS51cmwgPVxuICAgICAgJ21haWx0bzonICsgdGhpcy5zbGljZVNlcmlhbGl6ZSh0b2tlbilcbiAgfVxuXG4gIC8vXG4gIC8vIENyZWF0ZXJzLlxuICAvL1xuXG4gIGZ1bmN0aW9uIGJsb2NrUXVvdGUoKSB7XG4gICAgcmV0dXJuIHt0eXBlOiAnYmxvY2txdW90ZScsIGNoaWxkcmVuOiBbXX1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNvZGVGbG93KCkge1xuICAgIHJldHVybiB7dHlwZTogJ2NvZGUnLCBsYW5nOiBudWxsLCBtZXRhOiBudWxsLCB2YWx1ZTogJyd9XG4gIH1cblxuICBmdW5jdGlvbiBjb2RlVGV4dCgpIHtcbiAgICByZXR1cm4ge3R5cGU6ICdpbmxpbmVDb2RlJywgdmFsdWU6ICcnfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2RlZmluaXRpb24nLFxuICAgICAgaWRlbnRpZmllcjogJycsXG4gICAgICBsYWJlbDogbnVsbCxcbiAgICAgIHRpdGxlOiBudWxsLFxuICAgICAgdXJsOiAnJ1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVtcGhhc2lzKCkge1xuICAgIHJldHVybiB7dHlwZTogJ2VtcGhhc2lzJywgY2hpbGRyZW46IFtdfVxuICB9XG5cbiAgZnVuY3Rpb24gaGVhZGluZygpIHtcbiAgICByZXR1cm4ge3R5cGU6ICdoZWFkaW5nJywgZGVwdGg6IHVuZGVmaW5lZCwgY2hpbGRyZW46IFtdfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFyZEJyZWFrKCkge1xuICAgIHJldHVybiB7dHlwZTogJ2JyZWFrJ31cbiAgfVxuXG4gIGZ1bmN0aW9uIGh0bWwoKSB7XG4gICAgcmV0dXJuIHt0eXBlOiAnaHRtbCcsIHZhbHVlOiAnJ31cbiAgfVxuXG4gIGZ1bmN0aW9uIGltYWdlKCkge1xuICAgIHJldHVybiB7dHlwZTogJ2ltYWdlJywgdGl0bGU6IG51bGwsIHVybDogJycsIGFsdDogbnVsbH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmsoKSB7XG4gICAgcmV0dXJuIHt0eXBlOiAnbGluaycsIHRpdGxlOiBudWxsLCB1cmw6ICcnLCBjaGlsZHJlbjogW119XG4gIH1cblxuICBmdW5jdGlvbiBsaXN0KHRva2VuKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdsaXN0JyxcbiAgICAgIG9yZGVyZWQ6IHRva2VuLnR5cGUgPT09ICdsaXN0T3JkZXJlZCcsXG4gICAgICBzdGFydDogbnVsbCxcbiAgICAgIHNwcmVhZDogdG9rZW4uX3NwcmVhZCxcbiAgICAgIGNoaWxkcmVuOiBbXVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxpc3RJdGVtKHRva2VuKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdsaXN0SXRlbScsXG4gICAgICBzcHJlYWQ6IHRva2VuLl9zcHJlYWQsXG4gICAgICBjaGVja2VkOiBudWxsLFxuICAgICAgY2hpbGRyZW46IFtdXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyYWdyYXBoKCkge1xuICAgIHJldHVybiB7dHlwZTogJ3BhcmFncmFwaCcsIGNoaWxkcmVuOiBbXX1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0cm9uZygpIHtcbiAgICByZXR1cm4ge3R5cGU6ICdzdHJvbmcnLCBjaGlsZHJlbjogW119XG4gIH1cblxuICBmdW5jdGlvbiB0ZXh0KCkge1xuICAgIHJldHVybiB7dHlwZTogJ3RleHQnLCB2YWx1ZTogJyd9XG4gIH1cblxuICBmdW5jdGlvbiB0aGVtYXRpY0JyZWFrKCkge1xuICAgIHJldHVybiB7dHlwZTogJ3RoZW1hdGljQnJlYWsnfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ3VyZShjb25maWcsIGV4dGVuc2lvbnMpIHtcbiAgdmFyIGluZGV4ID0gLTFcblxuICB3aGlsZSAoKytpbmRleCA8IGV4dGVuc2lvbnMubGVuZ3RoKSB7XG4gICAgZXh0ZW5zaW9uKGNvbmZpZywgZXh0ZW5zaW9uc1tpbmRleF0pXG4gIH1cblxuICByZXR1cm4gY29uZmlnXG59XG5cbmZ1bmN0aW9uIGV4dGVuc2lvbihjb25maWcsIGV4dGVuc2lvbikge1xuICB2YXIga2V5XG4gIHZhciBsZWZ0XG5cbiAgZm9yIChrZXkgaW4gZXh0ZW5zaW9uKSB7XG4gICAgbGVmdCA9IG93bi5jYWxsKGNvbmZpZywga2V5KSA/IGNvbmZpZ1trZXldIDogKGNvbmZpZ1trZXldID0ge30pXG5cbiAgICBpZiAoa2V5ID09PSAnY2FuQ29udGFpbkVvbHMnIHx8IGtleSA9PT0gJ3RyYW5zZm9ybXMnKSB7XG4gICAgICBjb25maWdba2V5XSA9IFtdLmNvbmNhdChsZWZ0LCBleHRlbnNpb25ba2V5XSlcbiAgICB9IGVsc2Uge1xuICAgICAgT2JqZWN0LmFzc2lnbihsZWZ0LCBleHRlbnNpb25ba2V5XSlcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGlzdCcpXG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZVxuXG52YXIgZnJvbU1hcmtkb3duID0gcmVxdWlyZSgnbWRhc3QtdXRpbC1mcm9tLW1hcmtkb3duJylcblxuZnVuY3Rpb24gcGFyc2Uob3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXNcblxuICB0aGlzLlBhcnNlciA9IHBhcnNlXG5cbiAgZnVuY3Rpb24gcGFyc2UoZG9jKSB7XG4gICAgcmV0dXJuIGZyb21NYXJrZG93bihcbiAgICAgIGRvYyxcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIHNlbGYuZGF0YSgnc2V0dGluZ3MnKSwgb3B0aW9ucywge1xuICAgICAgICAvLyBOb3RlOiB0aGVzZSBvcHRpb25zIGFyZSBub3QgaW4gdGhlIHJlYWRtZS5cbiAgICAgICAgLy8gVGhlIGdvYWwgaXMgZm9yIHRoZW0gdG8gYmUgc2V0IGJ5IHBsdWdpbnMgb24gYGRhdGFgIGluc3RlYWQgb2YgYmVpbmdcbiAgICAgICAgLy8gcGFzc2VkIGJ5IHVzZXJzLlxuICAgICAgICBleHRlbnNpb25zOiBzZWxmLmRhdGEoJ21pY3JvbWFya0V4dGVuc2lvbnMnKSB8fCBbXSxcbiAgICAgICAgbWRhc3RFeHRlbnNpb25zOiBzZWxmLmRhdGEoJ2Zyb21NYXJrZG93bkV4dGVuc2lvbnMnKSB8fCBbXVxuICAgICAgfSlcbiAgICApXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJhaWxcblxuZnVuY3Rpb24gYmFpbChlcnIpIHtcbiAgaWYgKGVycikge1xuICAgIHRocm93IGVyclxuICB9XG59XG4iLCIvKiFcbiAqIERldGVybWluZSBpZiBhbiBvYmplY3QgaXMgYSBCdWZmZXJcbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIgKG9iaikge1xuICByZXR1cm4gb2JqICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yICE9IG51bGwgJiZcbiAgICB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbnZhciBnT1BEID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcblxudmFyIGlzQXJyYXkgPSBmdW5jdGlvbiBpc0FycmF5KGFycikge1xuXHRpZiAodHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShhcnIpO1xuXHR9XG5cblx0cmV0dXJuIHRvU3RyLmNhbGwoYXJyKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbnZhciBpc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcblx0aWYgKCFvYmogfHwgdG9TdHIuY2FsbChvYmopICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHZhciBoYXNPd25Db25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG5cdHZhciBoYXNJc1Byb3RvdHlwZU9mID0gb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgJiYgaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcblx0Ly8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuXHRpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNPd25Db25zdHJ1Y3RvciAmJiAhaGFzSXNQcm90b3R5cGVPZikge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIE93biBwcm9wZXJ0aWVzIGFyZSBlbnVtZXJhdGVkIGZpcnN0bHksIHNvIHRvIHNwZWVkIHVwLFxuXHQvLyBpZiBsYXN0IG9uZSBpcyBvd24sIHRoZW4gYWxsIHByb3BlcnRpZXMgYXJlIG93bi5cblx0dmFyIGtleTtcblx0Zm9yIChrZXkgaW4gb2JqKSB7IC8qKi8gfVxuXG5cdHJldHVybiB0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJyB8fCBoYXNPd24uY2FsbChvYmosIGtleSk7XG59O1xuXG4vLyBJZiBuYW1lIGlzICdfX3Byb3RvX18nLCBhbmQgT2JqZWN0LmRlZmluZVByb3BlcnR5IGlzIGF2YWlsYWJsZSwgZGVmaW5lIF9fcHJvdG9fXyBhcyBhbiBvd24gcHJvcGVydHkgb24gdGFyZ2V0XG52YXIgc2V0UHJvcGVydHkgPSBmdW5jdGlvbiBzZXRQcm9wZXJ0eSh0YXJnZXQsIG9wdGlvbnMpIHtcblx0aWYgKGRlZmluZVByb3BlcnR5ICYmIG9wdGlvbnMubmFtZSA9PT0gJ19fcHJvdG9fXycpIHtcblx0XHRkZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIG9wdGlvbnMubmFtZSwge1xuXHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcblx0XHRcdHZhbHVlOiBvcHRpb25zLm5ld1ZhbHVlLFxuXHRcdFx0d3JpdGFibGU6IHRydWVcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR0YXJnZXRbb3B0aW9ucy5uYW1lXSA9IG9wdGlvbnMubmV3VmFsdWU7XG5cdH1cbn07XG5cbi8vIFJldHVybiB1bmRlZmluZWQgaW5zdGVhZCBvZiBfX3Byb3RvX18gaWYgJ19fcHJvdG9fXycgaXMgbm90IGFuIG93biBwcm9wZXJ0eVxudmFyIGdldFByb3BlcnR5ID0gZnVuY3Rpb24gZ2V0UHJvcGVydHkob2JqLCBuYW1lKSB7XG5cdGlmIChuYW1lID09PSAnX19wcm90b19fJykge1xuXHRcdGlmICghaGFzT3duLmNhbGwob2JqLCBuYW1lKSkge1xuXHRcdFx0cmV0dXJuIHZvaWQgMDtcblx0XHR9IGVsc2UgaWYgKGdPUEQpIHtcblx0XHRcdC8vIEluIGVhcmx5IHZlcnNpb25zIG9mIG5vZGUsIG9ialsnX19wcm90b19fJ10gaXMgYnVnZ3kgd2hlbiBvYmogaGFzXG5cdFx0XHQvLyBfX3Byb3RvX18gYXMgYW4gb3duIHByb3BlcnR5LiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKCkgd29ya3MuXG5cdFx0XHRyZXR1cm4gZ09QRChvYmosIG5hbWUpLnZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBvYmpbbmFtZV07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGV4dGVuZCgpIHtcblx0dmFyIG9wdGlvbnMsIG5hbWUsIHNyYywgY29weSwgY29weUlzQXJyYXksIGNsb25lO1xuXHR2YXIgdGFyZ2V0ID0gYXJndW1lbnRzWzBdO1xuXHR2YXIgaSA9IDE7XG5cdHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuXHR2YXIgZGVlcCA9IGZhbHNlO1xuXG5cdC8vIEhhbmRsZSBhIGRlZXAgY29weSBzaXR1YXRpb25cblx0aWYgKHR5cGVvZiB0YXJnZXQgPT09ICdib29sZWFuJykge1xuXHRcdGRlZXAgPSB0YXJnZXQ7XG5cdFx0dGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuXHRcdC8vIHNraXAgdGhlIGJvb2xlYW4gYW5kIHRoZSB0YXJnZXRcblx0XHRpID0gMjtcblx0fVxuXHRpZiAodGFyZ2V0ID09IG51bGwgfHwgKHR5cGVvZiB0YXJnZXQgIT09ICdvYmplY3QnICYmIHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicpKSB7XG5cdFx0dGFyZ2V0ID0ge307XG5cdH1cblxuXHRmb3IgKDsgaSA8IGxlbmd0aDsgKytpKSB7XG5cdFx0b3B0aW9ucyA9IGFyZ3VtZW50c1tpXTtcblx0XHQvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG5cdFx0aWYgKG9wdGlvbnMgIT0gbnVsbCkge1xuXHRcdFx0Ly8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuXHRcdFx0Zm9yIChuYW1lIGluIG9wdGlvbnMpIHtcblx0XHRcdFx0c3JjID0gZ2V0UHJvcGVydHkodGFyZ2V0LCBuYW1lKTtcblx0XHRcdFx0Y29weSA9IGdldFByb3BlcnR5KG9wdGlvbnMsIG5hbWUpO1xuXG5cdFx0XHRcdC8vIFByZXZlbnQgbmV2ZXItZW5kaW5nIGxvb3Bcblx0XHRcdFx0aWYgKHRhcmdldCAhPT0gY29weSkge1xuXHRcdFx0XHRcdC8vIFJlY3Vyc2UgaWYgd2UncmUgbWVyZ2luZyBwbGFpbiBvYmplY3RzIG9yIGFycmF5c1xuXHRcdFx0XHRcdGlmIChkZWVwICYmIGNvcHkgJiYgKGlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gaXNBcnJheShjb3B5KSkpKSB7XG5cdFx0XHRcdFx0XHRpZiAoY29weUlzQXJyYXkpIHtcblx0XHRcdFx0XHRcdFx0Y29weUlzQXJyYXkgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgaXNBcnJheShzcmMpID8gc3JjIDogW107XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBpc1BsYWluT2JqZWN0KHNyYykgPyBzcmMgOiB7fTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gTmV2ZXIgbW92ZSBvcmlnaW5hbCBvYmplY3RzLCBjbG9uZSB0aGVtXG5cdFx0XHRcdFx0XHRzZXRQcm9wZXJ0eSh0YXJnZXQsIHsgbmFtZTogbmFtZSwgbmV3VmFsdWU6IGV4dGVuZChkZWVwLCBjbG9uZSwgY29weSkgfSk7XG5cblx0XHRcdFx0XHQvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY29weSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0XHRcdHNldFByb3BlcnR5KHRhcmdldCwgeyBuYW1lOiBuYW1lLCBuZXdWYWx1ZTogY29weSB9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuXHRyZXR1cm4gdGFyZ2V0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB2YWx1ZSA9PiB7XG5cdGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGNvbnN0IHByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSk7XG5cdHJldHVybiBwcm90b3R5cGUgPT09IG51bGwgfHwgcHJvdG90eXBlID09PSBPYmplY3QucHJvdG90eXBlO1xufTtcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgc2xpY2UgPSBbXS5zbGljZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdyYXBcblxuLy8gV3JhcCBgZm5gLlxuLy8gQ2FuIGJlIHN5bmMgb3IgYXN5bmM7IHJldHVybiBhIHByb21pc2UsIHJlY2VpdmUgYSBjb21wbGV0aW9uIGhhbmRsZXIsIHJldHVyblxuLy8gbmV3IHZhbHVlcyBhbmQgZXJyb3JzLlxuZnVuY3Rpb24gd3JhcChmbiwgY2FsbGJhY2spIHtcbiAgdmFyIGludm9rZWRcblxuICByZXR1cm4gd3JhcHBlZFxuXG4gIGZ1bmN0aW9uIHdyYXBwZWQoKSB7XG4gICAgdmFyIHBhcmFtcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuICAgIHZhciBjYWxsYmFjayA9IGZuLmxlbmd0aCA+IHBhcmFtcy5sZW5ndGhcbiAgICB2YXIgcmVzdWx0XG5cbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIHBhcmFtcy5wdXNoKGRvbmUpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHJlc3VsdCA9IGZuLmFwcGx5KG51bGwsIHBhcmFtcylcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gV2VsbCwgdGhpcyBpcyBxdWl0ZSB0aGUgcGlja2xlLlxuICAgICAgLy8gYGZuYCByZWNlaXZlZCBhIGNhbGxiYWNrIGFuZCBpbnZva2VkIGl0ICh0aHVzIGNvbnRpbnVpbmcgdGhlIHBpcGVsaW5lKSxcbiAgICAgIC8vIGJ1dCBsYXRlciBhbHNvIHRocmV3IGFuIGVycm9yLlxuICAgICAgLy8gV2XigJlyZSBub3QgYWJvdXQgdG8gcmVzdGFydCB0aGUgcGlwZWxpbmUgYWdhaW4sIHNvIHRoZSBvbmx5IHRoaW5nIGxlZnRcbiAgICAgIC8vIHRvIGRvIGlzIHRvIHRocm93IHRoZSB0aGluZyBpbnN0ZWFkLlxuICAgICAgaWYgKGNhbGxiYWNrICYmIGludm9rZWQpIHtcbiAgICAgICAgdGhyb3cgZXJyb3JcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRvbmUoZXJyb3IpXG4gICAgfVxuXG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgaWYgKHJlc3VsdCAmJiB0eXBlb2YgcmVzdWx0LnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmVzdWx0LnRoZW4odGhlbiwgZG9uZSlcbiAgICAgIH0gZWxzZSBpZiAocmVzdWx0IGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgZG9uZShyZXN1bHQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGVuKHJlc3VsdClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJbnZva2UgYG5leHRgLCBvbmx5IG9uY2UuXG4gIGZ1bmN0aW9uIGRvbmUoKSB7XG4gICAgaWYgKCFpbnZva2VkKSB7XG4gICAgICBpbnZva2VkID0gdHJ1ZVxuXG4gICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgfVxuICB9XG5cbiAgLy8gSW52b2tlIGBkb25lYCB3aXRoIG9uZSB2YWx1ZS5cbiAgLy8gVHJhY2tzIGlmIGFuIGVycm9yIGlzIHBhc3NlZCwgdG9vLlxuICBmdW5jdGlvbiB0aGVuKHZhbHVlKSB7XG4gICAgZG9uZShudWxsLCB2YWx1ZSlcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciB3cmFwID0gcmVxdWlyZSgnLi93cmFwLmpzJylcblxubW9kdWxlLmV4cG9ydHMgPSB0cm91Z2hcblxudHJvdWdoLndyYXAgPSB3cmFwXG5cbnZhciBzbGljZSA9IFtdLnNsaWNlXG5cbi8vIENyZWF0ZSBuZXcgbWlkZGxld2FyZS5cbmZ1bmN0aW9uIHRyb3VnaCgpIHtcbiAgdmFyIGZucyA9IFtdXG4gIHZhciBtaWRkbGV3YXJlID0ge31cblxuICBtaWRkbGV3YXJlLnJ1biA9IHJ1blxuICBtaWRkbGV3YXJlLnVzZSA9IHVzZVxuXG4gIHJldHVybiBtaWRkbGV3YXJlXG5cbiAgLy8gUnVuIGBmbnNgLiAgTGFzdCBhcmd1bWVudCBtdXN0IGJlIGEgY29tcGxldGlvbiBoYW5kbGVyLlxuICBmdW5jdGlvbiBydW4oKSB7XG4gICAgdmFyIGluZGV4ID0gLTFcbiAgICB2YXIgaW5wdXQgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgLTEpXG4gICAgdmFyIGRvbmUgPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdXG5cbiAgICBpZiAodHlwZW9mIGRvbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgZnVuY3Rpb24gYXMgbGFzdCBhcmd1bWVudCwgbm90ICcgKyBkb25lKVxuICAgIH1cblxuICAgIG5leHQuYXBwbHkobnVsbCwgW251bGxdLmNvbmNhdChpbnB1dCkpXG5cbiAgICAvLyBSdW4gdGhlIG5leHQgYGZuYCwgaWYgYW55LlxuICAgIGZ1bmN0aW9uIG5leHQoZXJyKSB7XG4gICAgICB2YXIgZm4gPSBmbnNbKytpbmRleF1cbiAgICAgIHZhciBwYXJhbXMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMClcbiAgICAgIHZhciB2YWx1ZXMgPSBwYXJhbXMuc2xpY2UoMSlcbiAgICAgIHZhciBsZW5ndGggPSBpbnB1dC5sZW5ndGhcbiAgICAgIHZhciBwb3MgPSAtMVxuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGRvbmUoZXJyKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgLy8gQ29weSBub24tbnVsbHkgaW5wdXQgaW50byB2YWx1ZXMuXG4gICAgICB3aGlsZSAoKytwb3MgPCBsZW5ndGgpIHtcbiAgICAgICAgaWYgKHZhbHVlc1twb3NdID09PSBudWxsIHx8IHZhbHVlc1twb3NdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB2YWx1ZXNbcG9zXSA9IGlucHV0W3Bvc11cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpbnB1dCA9IHZhbHVlc1xuXG4gICAgICAvLyBOZXh0IG9yIGRvbmUuXG4gICAgICBpZiAoZm4pIHtcbiAgICAgICAgd3JhcChmbiwgbmV4dCkuYXBwbHkobnVsbCwgaW5wdXQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb25lLmFwcGx5KG51bGwsIFtudWxsXS5jb25jYXQoaW5wdXQpKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBgZm5gIHRvIHRoZSBsaXN0LlxuICBmdW5jdGlvbiB1c2UoZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIGBmbmAgdG8gYmUgYSBmdW5jdGlvbiwgbm90ICcgKyBmbilcbiAgICB9XG5cbiAgICBmbnMucHVzaChmbilcblxuICAgIHJldHVybiBtaWRkbGV3YXJlXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgc3RyaW5naWZ5ID0gcmVxdWlyZSgndW5pc3QtdXRpbC1zdHJpbmdpZnktcG9zaXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZNZXNzYWdlXG5cbi8vIEluaGVyaXQgZnJvbSBgRXJyb3IjYC5cbmZ1bmN0aW9uIFZNZXNzYWdlUHJvdG90eXBlKCkge31cblZNZXNzYWdlUHJvdG90eXBlLnByb3RvdHlwZSA9IEVycm9yLnByb3RvdHlwZVxuVk1lc3NhZ2UucHJvdG90eXBlID0gbmV3IFZNZXNzYWdlUHJvdG90eXBlKClcblxuLy8gTWVzc2FnZSBwcm9wZXJ0aWVzLlxudmFyIHByb3RvID0gVk1lc3NhZ2UucHJvdG90eXBlXG5cbnByb3RvLmZpbGUgPSAnJ1xucHJvdG8ubmFtZSA9ICcnXG5wcm90by5yZWFzb24gPSAnJ1xucHJvdG8ubWVzc2FnZSA9ICcnXG5wcm90by5zdGFjayA9ICcnXG5wcm90by5mYXRhbCA9IG51bGxcbnByb3RvLmNvbHVtbiA9IG51bGxcbnByb3RvLmxpbmUgPSBudWxsXG5cbi8vIENvbnN0cnVjdCBhIG5ldyBWTWVzc2FnZS5cbi8vXG4vLyBOb3RlOiBXZSBjYW5ub3QgaW52b2tlIGBFcnJvcmAgb24gdGhlIGNyZWF0ZWQgY29udGV4dCwgYXMgdGhhdCBhZGRzIHJlYWRvbmx5XG4vLyBgbGluZWAgYW5kIGBjb2x1bW5gIGF0dHJpYnV0ZXMgb24gU2FmYXJpIDksIHRodXMgdGhyb3dpbmcgYW5kIGZhaWxpbmcgdGhlXG4vLyBkYXRhLlxuZnVuY3Rpb24gVk1lc3NhZ2UocmVhc29uLCBwb3NpdGlvbiwgb3JpZ2luKSB7XG4gIHZhciBwYXJ0c1xuICB2YXIgcmFuZ2VcbiAgdmFyIGxvY2F0aW9uXG5cbiAgaWYgKHR5cGVvZiBwb3NpdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICBvcmlnaW4gPSBwb3NpdGlvblxuICAgIHBvc2l0aW9uID0gbnVsbFxuICB9XG5cbiAgcGFydHMgPSBwYXJzZU9yaWdpbihvcmlnaW4pXG4gIHJhbmdlID0gc3RyaW5naWZ5KHBvc2l0aW9uKSB8fCAnMToxJ1xuXG4gIGxvY2F0aW9uID0ge1xuICAgIHN0YXJ0OiB7bGluZTogbnVsbCwgY29sdW1uOiBudWxsfSxcbiAgICBlbmQ6IHtsaW5lOiBudWxsLCBjb2x1bW46IG51bGx9XG4gIH1cblxuICAvLyBOb2RlLlxuICBpZiAocG9zaXRpb24gJiYgcG9zaXRpb24ucG9zaXRpb24pIHtcbiAgICBwb3NpdGlvbiA9IHBvc2l0aW9uLnBvc2l0aW9uXG4gIH1cblxuICBpZiAocG9zaXRpb24pIHtcbiAgICAvLyBQb3NpdGlvbi5cbiAgICBpZiAocG9zaXRpb24uc3RhcnQpIHtcbiAgICAgIGxvY2F0aW9uID0gcG9zaXRpb25cbiAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24uc3RhcnRcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUG9pbnQuXG4gICAgICBsb2NhdGlvbi5zdGFydCA9IHBvc2l0aW9uXG4gICAgfVxuICB9XG5cbiAgaWYgKHJlYXNvbi5zdGFjaykge1xuICAgIHRoaXMuc3RhY2sgPSByZWFzb24uc3RhY2tcbiAgICByZWFzb24gPSByZWFzb24ubWVzc2FnZVxuICB9XG5cbiAgdGhpcy5tZXNzYWdlID0gcmVhc29uXG4gIHRoaXMubmFtZSA9IHJhbmdlXG4gIHRoaXMucmVhc29uID0gcmVhc29uXG4gIHRoaXMubGluZSA9IHBvc2l0aW9uID8gcG9zaXRpb24ubGluZSA6IG51bGxcbiAgdGhpcy5jb2x1bW4gPSBwb3NpdGlvbiA/IHBvc2l0aW9uLmNvbHVtbiA6IG51bGxcbiAgdGhpcy5sb2NhdGlvbiA9IGxvY2F0aW9uXG4gIHRoaXMuc291cmNlID0gcGFydHNbMF1cbiAgdGhpcy5ydWxlSWQgPSBwYXJ0c1sxXVxufVxuXG5mdW5jdGlvbiBwYXJzZU9yaWdpbihvcmlnaW4pIHtcbiAgdmFyIHJlc3VsdCA9IFtudWxsLCBudWxsXVxuICB2YXIgaW5kZXhcblxuICBpZiAodHlwZW9mIG9yaWdpbiA9PT0gJ3N0cmluZycpIHtcbiAgICBpbmRleCA9IG9yaWdpbi5pbmRleE9mKCc6JylcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgIHJlc3VsdFsxXSA9IG9yaWdpblxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHRbMF0gPSBvcmlnaW4uc2xpY2UoMCwgaW5kZXgpXG4gICAgICByZXN1bHRbMV0gPSBvcmlnaW4uc2xpY2UoaW5kZXggKyAxKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ3BhdGgnKVxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gcHJvY2Vzc1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBwID0gcmVxdWlyZSgnLi9taW5wYXRoJylcbnZhciBwcm9jID0gcmVxdWlyZSgnLi9taW5wcm9jJylcbnZhciBidWZmZXIgPSByZXF1aXJlKCdpcy1idWZmZXInKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZGaWxlXG5cbnZhciBvd24gPSB7fS5oYXNPd25Qcm9wZXJ0eVxuXG4vLyBPcmRlciBvZiBzZXR0aW5nIChsZWFzdCBzcGVjaWZpYyB0byBtb3N0KSwgd2UgbmVlZCB0aGlzIGJlY2F1c2Ugb3RoZXJ3aXNlXG4vLyBge3N0ZW06ICdhJywgcGF0aDogJ34vYi5qcyd9YCB3b3VsZCB0aHJvdywgYXMgYSBwYXRoIGlzIG5lZWRlZCBiZWZvcmUgYVxuLy8gc3RlbSBjYW4gYmUgc2V0LlxudmFyIG9yZGVyID0gWydoaXN0b3J5JywgJ3BhdGgnLCAnYmFzZW5hbWUnLCAnc3RlbScsICdleHRuYW1lJywgJ2Rpcm5hbWUnXVxuXG5WRmlsZS5wcm90b3R5cGUudG9TdHJpbmcgPSB0b1N0cmluZ1xuXG4vLyBBY2Nlc3MgZnVsbCBwYXRoIChgfi9pbmRleC5taW4uanNgKS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShWRmlsZS5wcm90b3R5cGUsICdwYXRoJywge2dldDogZ2V0UGF0aCwgc2V0OiBzZXRQYXRofSlcblxuLy8gQWNjZXNzIHBhcmVudCBwYXRoIChgfmApLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFZGaWxlLnByb3RvdHlwZSwgJ2Rpcm5hbWUnLCB7XG4gIGdldDogZ2V0RGlybmFtZSxcbiAgc2V0OiBzZXREaXJuYW1lXG59KVxuXG4vLyBBY2Nlc3MgYmFzZW5hbWUgKGBpbmRleC5taW4uanNgKS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShWRmlsZS5wcm90b3R5cGUsICdiYXNlbmFtZScsIHtcbiAgZ2V0OiBnZXRCYXNlbmFtZSxcbiAgc2V0OiBzZXRCYXNlbmFtZVxufSlcblxuLy8gQWNjZXNzIGV4dG5hbWUgKGAuanNgKS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShWRmlsZS5wcm90b3R5cGUsICdleHRuYW1lJywge1xuICBnZXQ6IGdldEV4dG5hbWUsXG4gIHNldDogc2V0RXh0bmFtZVxufSlcblxuLy8gQWNjZXNzIHN0ZW0gKGBpbmRleC5taW5gKS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShWRmlsZS5wcm90b3R5cGUsICdzdGVtJywge2dldDogZ2V0U3RlbSwgc2V0OiBzZXRTdGVtfSlcblxuLy8gQ29uc3RydWN0IGEgbmV3IGZpbGUuXG5mdW5jdGlvbiBWRmlsZShvcHRpb25zKSB7XG4gIHZhciBwcm9wXG4gIHZhciBpbmRleFxuXG4gIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJyB8fCBidWZmZXIob3B0aW9ucykpIHtcbiAgICBvcHRpb25zID0ge2NvbnRlbnRzOiBvcHRpb25zfVxuICB9IGVsc2UgaWYgKCdtZXNzYWdlJyBpbiBvcHRpb25zICYmICdtZXNzYWdlcycgaW4gb3B0aW9ucykge1xuICAgIHJldHVybiBvcHRpb25zXG4gIH1cblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVkZpbGUpKSB7XG4gICAgcmV0dXJuIG5ldyBWRmlsZShvcHRpb25zKVxuICB9XG5cbiAgdGhpcy5kYXRhID0ge31cbiAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gIHRoaXMuaGlzdG9yeSA9IFtdXG4gIHRoaXMuY3dkID0gcHJvYy5jd2QoKVxuXG4gIC8vIFNldCBwYXRoIHJlbGF0ZWQgcHJvcGVydGllcyBpbiB0aGUgY29ycmVjdCBvcmRlci5cbiAgaW5kZXggPSAtMVxuXG4gIHdoaWxlICgrK2luZGV4IDwgb3JkZXIubGVuZ3RoKSB7XG4gICAgcHJvcCA9IG9yZGVyW2luZGV4XVxuXG4gICAgaWYgKG93bi5jYWxsKG9wdGlvbnMsIHByb3ApKSB7XG4gICAgICB0aGlzW3Byb3BdID0gb3B0aW9uc1twcm9wXVxuICAgIH1cbiAgfVxuXG4gIC8vIFNldCBub24tcGF0aCByZWxhdGVkIHByb3BlcnRpZXMuXG4gIGZvciAocHJvcCBpbiBvcHRpb25zKSB7XG4gICAgaWYgKG9yZGVyLmluZGV4T2YocHJvcCkgPCAwKSB7XG4gICAgICB0aGlzW3Byb3BdID0gb3B0aW9uc1twcm9wXVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXRoKCkge1xuICByZXR1cm4gdGhpcy5oaXN0b3J5W3RoaXMuaGlzdG9yeS5sZW5ndGggLSAxXVxufVxuXG5mdW5jdGlvbiBzZXRQYXRoKHBhdGgpIHtcbiAgYXNzZXJ0Tm9uRW1wdHkocGF0aCwgJ3BhdGgnKVxuXG4gIGlmICh0aGlzLnBhdGggIT09IHBhdGgpIHtcbiAgICB0aGlzLmhpc3RvcnkucHVzaChwYXRoKVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldERpcm5hbWUoKSB7XG4gIHJldHVybiB0eXBlb2YgdGhpcy5wYXRoID09PSAnc3RyaW5nJyA/IHAuZGlybmFtZSh0aGlzLnBhdGgpIDogdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIHNldERpcm5hbWUoZGlybmFtZSkge1xuICBhc3NlcnRQYXRoKHRoaXMucGF0aCwgJ2Rpcm5hbWUnKVxuICB0aGlzLnBhdGggPSBwLmpvaW4oZGlybmFtZSB8fCAnJywgdGhpcy5iYXNlbmFtZSlcbn1cblxuZnVuY3Rpb24gZ2V0QmFzZW5hbWUoKSB7XG4gIHJldHVybiB0eXBlb2YgdGhpcy5wYXRoID09PSAnc3RyaW5nJyA/IHAuYmFzZW5hbWUodGhpcy5wYXRoKSA6IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBzZXRCYXNlbmFtZShiYXNlbmFtZSkge1xuICBhc3NlcnROb25FbXB0eShiYXNlbmFtZSwgJ2Jhc2VuYW1lJylcbiAgYXNzZXJ0UGFydChiYXNlbmFtZSwgJ2Jhc2VuYW1lJylcbiAgdGhpcy5wYXRoID0gcC5qb2luKHRoaXMuZGlybmFtZSB8fCAnJywgYmFzZW5hbWUpXG59XG5cbmZ1bmN0aW9uIGdldEV4dG5hbWUoKSB7XG4gIHJldHVybiB0eXBlb2YgdGhpcy5wYXRoID09PSAnc3RyaW5nJyA/IHAuZXh0bmFtZSh0aGlzLnBhdGgpIDogdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIHNldEV4dG5hbWUoZXh0bmFtZSkge1xuICBhc3NlcnRQYXJ0KGV4dG5hbWUsICdleHRuYW1lJylcbiAgYXNzZXJ0UGF0aCh0aGlzLnBhdGgsICdleHRuYW1lJylcblxuICBpZiAoZXh0bmFtZSkge1xuICAgIGlmIChleHRuYW1lLmNoYXJDb2RlQXQoMCkgIT09IDQ2IC8qIGAuYCAqLykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdgZXh0bmFtZWAgbXVzdCBzdGFydCB3aXRoIGAuYCcpXG4gICAgfVxuXG4gICAgaWYgKGV4dG5hbWUuaW5kZXhPZignLicsIDEpID4gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYGV4dG5hbWVgIGNhbm5vdCBjb250YWluIG11bHRpcGxlIGRvdHMnKVxuICAgIH1cbiAgfVxuXG4gIHRoaXMucGF0aCA9IHAuam9pbih0aGlzLmRpcm5hbWUsIHRoaXMuc3RlbSArIChleHRuYW1lIHx8ICcnKSlcbn1cblxuZnVuY3Rpb24gZ2V0U3RlbSgpIHtcbiAgcmV0dXJuIHR5cGVvZiB0aGlzLnBhdGggPT09ICdzdHJpbmcnXG4gICAgPyBwLmJhc2VuYW1lKHRoaXMucGF0aCwgdGhpcy5leHRuYW1lKVxuICAgIDogdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIHNldFN0ZW0oc3RlbSkge1xuICBhc3NlcnROb25FbXB0eShzdGVtLCAnc3RlbScpXG4gIGFzc2VydFBhcnQoc3RlbSwgJ3N0ZW0nKVxuICB0aGlzLnBhdGggPSBwLmpvaW4odGhpcy5kaXJuYW1lIHx8ICcnLCBzdGVtICsgKHRoaXMuZXh0bmFtZSB8fCAnJykpXG59XG5cbi8vIEdldCB0aGUgdmFsdWUgb2YgdGhlIGZpbGUuXG5mdW5jdGlvbiB0b1N0cmluZyhlbmNvZGluZykge1xuICByZXR1cm4gKHRoaXMuY29udGVudHMgfHwgJycpLnRvU3RyaW5nKGVuY29kaW5nKVxufVxuXG4vLyBBc3NlcnQgdGhhdCBgcGFydGAgaXMgbm90IGEgcGF0aCAoaS5lLiwgZG9lcyBub3QgY29udGFpbiBgcC5zZXBgKS5cbmZ1bmN0aW9uIGFzc2VydFBhcnQocGFydCwgbmFtZSkge1xuICBpZiAocGFydCAmJiBwYXJ0LmluZGV4T2YocC5zZXApID4gLTEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnYCcgKyBuYW1lICsgJ2AgY2Fubm90IGJlIGEgcGF0aDogZGlkIG5vdCBleHBlY3QgYCcgKyBwLnNlcCArICdgJ1xuICAgIClcbiAgfVxufVxuXG4vLyBBc3NlcnQgdGhhdCBgcGFydGAgaXMgbm90IGVtcHR5LlxuZnVuY3Rpb24gYXNzZXJ0Tm9uRW1wdHkocGFydCwgbmFtZSkge1xuICBpZiAoIXBhcnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2AnICsgbmFtZSArICdgIGNhbm5vdCBiZSBlbXB0eScpXG4gIH1cbn1cblxuLy8gQXNzZXJ0IGBwYXRoYCBleGlzdHMuXG5mdW5jdGlvbiBhc3NlcnRQYXRoKHBhdGgsIG5hbWUpIHtcbiAgaWYgKCFwYXRoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTZXR0aW5nIGAnICsgbmFtZSArICdgIHJlcXVpcmVzIGBwYXRoYCB0byBiZSBzZXQgdG9vJylcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBWTWVzc2FnZSA9IHJlcXVpcmUoJ3ZmaWxlLW1lc3NhZ2UnKVxudmFyIFZGaWxlID0gcmVxdWlyZSgnLi9jb3JlLmpzJylcblxubW9kdWxlLmV4cG9ydHMgPSBWRmlsZVxuXG5WRmlsZS5wcm90b3R5cGUubWVzc2FnZSA9IG1lc3NhZ2VcblZGaWxlLnByb3RvdHlwZS5pbmZvID0gaW5mb1xuVkZpbGUucHJvdG90eXBlLmZhaWwgPSBmYWlsXG5cbi8vIENyZWF0ZSBhIG1lc3NhZ2Ugd2l0aCBgcmVhc29uYCBhdCBgcG9zaXRpb25gLlxuLy8gV2hlbiBhbiBlcnJvciBpcyBwYXNzZWQgaW4gYXMgYHJlYXNvbmAsIGNvcGllcyB0aGUgc3RhY2suXG5mdW5jdGlvbiBtZXNzYWdlKHJlYXNvbiwgcG9zaXRpb24sIG9yaWdpbikge1xuICB2YXIgbWVzc2FnZSA9IG5ldyBWTWVzc2FnZShyZWFzb24sIHBvc2l0aW9uLCBvcmlnaW4pXG5cbiAgaWYgKHRoaXMucGF0aCkge1xuICAgIG1lc3NhZ2UubmFtZSA9IHRoaXMucGF0aCArICc6JyArIG1lc3NhZ2UubmFtZVxuICAgIG1lc3NhZ2UuZmlsZSA9IHRoaXMucGF0aFxuICB9XG5cbiAgbWVzc2FnZS5mYXRhbCA9IGZhbHNlXG5cbiAgdGhpcy5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpXG5cbiAgcmV0dXJuIG1lc3NhZ2Vcbn1cblxuLy8gRmFpbDogY3JlYXRlcyBhIHZtZXNzYWdlLCBhc3NvY2lhdGVzIGl0IHdpdGggdGhlIGZpbGUsIGFuZCB0aHJvd3MgaXQuXG5mdW5jdGlvbiBmYWlsKCkge1xuICB2YXIgbWVzc2FnZSA9IHRoaXMubWVzc2FnZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgbWVzc2FnZS5mYXRhbCA9IHRydWVcblxuICB0aHJvdyBtZXNzYWdlXG59XG5cbi8vIEluZm86IGNyZWF0ZXMgYSB2bWVzc2FnZSwgYXNzb2NpYXRlcyBpdCB3aXRoIHRoZSBmaWxlLCBhbmQgbWFya3MgdGhlIGZhdGFsaXR5XG4vLyBhcyBudWxsLlxuZnVuY3Rpb24gaW5mbygpIHtcbiAgdmFyIG1lc3NhZ2UgPSB0aGlzLm1lc3NhZ2UuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG4gIG1lc3NhZ2UuZmF0YWwgPSBudWxsXG5cbiAgcmV0dXJuIG1lc3NhZ2Vcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliJylcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYmFpbCA9IHJlcXVpcmUoJ2JhaWwnKVxudmFyIGJ1ZmZlciA9IHJlcXVpcmUoJ2lzLWJ1ZmZlcicpXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJylcbnZhciBwbGFpbiA9IHJlcXVpcmUoJ2lzLXBsYWluLW9iaicpXG52YXIgdHJvdWdoID0gcmVxdWlyZSgndHJvdWdoJylcbnZhciB2ZmlsZSA9IHJlcXVpcmUoJ3ZmaWxlJylcblxuLy8gRXhwb3NlIGEgZnJvemVuIHByb2Nlc3Nvci5cbm1vZHVsZS5leHBvcnRzID0gdW5pZmllZCgpLmZyZWV6ZSgpXG5cbnZhciBzbGljZSA9IFtdLnNsaWNlXG52YXIgb3duID0ge30uaGFzT3duUHJvcGVydHlcblxuLy8gUHJvY2VzcyBwaXBlbGluZS5cbnZhciBwaXBlbGluZSA9IHRyb3VnaCgpXG4gIC51c2UocGlwZWxpbmVQYXJzZSlcbiAgLnVzZShwaXBlbGluZVJ1bilcbiAgLnVzZShwaXBlbGluZVN0cmluZ2lmeSlcblxuZnVuY3Rpb24gcGlwZWxpbmVQYXJzZShwLCBjdHgpIHtcbiAgY3R4LnRyZWUgPSBwLnBhcnNlKGN0eC5maWxlKVxufVxuXG5mdW5jdGlvbiBwaXBlbGluZVJ1bihwLCBjdHgsIG5leHQpIHtcbiAgcC5ydW4oY3R4LnRyZWUsIGN0eC5maWxlLCBkb25lKVxuXG4gIGZ1bmN0aW9uIGRvbmUoZXJyb3IsIHRyZWUsIGZpbGUpIHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIG5leHQoZXJyb3IpXG4gICAgfSBlbHNlIHtcbiAgICAgIGN0eC50cmVlID0gdHJlZVxuICAgICAgY3R4LmZpbGUgPSBmaWxlXG4gICAgICBuZXh0KClcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGlwZWxpbmVTdHJpbmdpZnkocCwgY3R4KSB7XG4gIHZhciByZXN1bHQgPSBwLnN0cmluZ2lmeShjdHgudHJlZSwgY3R4LmZpbGUpXG5cbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkIHx8IHJlc3VsdCA9PT0gbnVsbCkge1xuICAgIC8vIEVtcHR5LlxuICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnIHx8IGJ1ZmZlcihyZXN1bHQpKSB7XG4gICAgY3R4LmZpbGUuY29udGVudHMgPSByZXN1bHRcbiAgfSBlbHNlIHtcbiAgICBjdHguZmlsZS5yZXN1bHQgPSByZXN1bHRcbiAgfVxufVxuXG4vLyBGdW5jdGlvbiB0byBjcmVhdGUgdGhlIGZpcnN0IHByb2Nlc3Nvci5cbmZ1bmN0aW9uIHVuaWZpZWQoKSB7XG4gIHZhciBhdHRhY2hlcnMgPSBbXVxuICB2YXIgdHJhbnNmb3JtZXJzID0gdHJvdWdoKClcbiAgdmFyIG5hbWVzcGFjZSA9IHt9XG4gIHZhciBmcmVlemVJbmRleCA9IC0xXG4gIHZhciBmcm96ZW5cblxuICAvLyBEYXRhIG1hbmFnZW1lbnQuXG4gIHByb2Nlc3Nvci5kYXRhID0gZGF0YVxuXG4gIC8vIExvY2suXG4gIHByb2Nlc3Nvci5mcmVlemUgPSBmcmVlemVcblxuICAvLyBQbHVnaW5zLlxuICBwcm9jZXNzb3IuYXR0YWNoZXJzID0gYXR0YWNoZXJzXG4gIHByb2Nlc3Nvci51c2UgPSB1c2VcblxuICAvLyBBUEkuXG4gIHByb2Nlc3Nvci5wYXJzZSA9IHBhcnNlXG4gIHByb2Nlc3Nvci5zdHJpbmdpZnkgPSBzdHJpbmdpZnlcbiAgcHJvY2Vzc29yLnJ1biA9IHJ1blxuICBwcm9jZXNzb3IucnVuU3luYyA9IHJ1blN5bmNcbiAgcHJvY2Vzc29yLnByb2Nlc3MgPSBwcm9jZXNzXG4gIHByb2Nlc3Nvci5wcm9jZXNzU3luYyA9IHByb2Nlc3NTeW5jXG5cbiAgLy8gRXhwb3NlLlxuICByZXR1cm4gcHJvY2Vzc29yXG5cbiAgLy8gQ3JlYXRlIGEgbmV3IHByb2Nlc3NvciBiYXNlZCBvbiB0aGUgcHJvY2Vzc29yIGluIHRoZSBjdXJyZW50IHNjb3BlLlxuICBmdW5jdGlvbiBwcm9jZXNzb3IoKSB7XG4gICAgdmFyIGRlc3RpbmF0aW9uID0gdW5pZmllZCgpXG4gICAgdmFyIGluZGV4ID0gLTFcblxuICAgIHdoaWxlICgrK2luZGV4IDwgYXR0YWNoZXJzLmxlbmd0aCkge1xuICAgICAgZGVzdGluYXRpb24udXNlLmFwcGx5KG51bGwsIGF0dGFjaGVyc1tpbmRleF0pXG4gICAgfVxuXG4gICAgZGVzdGluYXRpb24uZGF0YShleHRlbmQodHJ1ZSwge30sIG5hbWVzcGFjZSkpXG5cbiAgICByZXR1cm4gZGVzdGluYXRpb25cbiAgfVxuXG4gIC8vIEZyZWV6ZTogdXNlZCB0byBzaWduYWwgYSBwcm9jZXNzb3IgdGhhdCBoYXMgZmluaXNoZWQgY29uZmlndXJhdGlvbi5cbiAgLy9cbiAgLy8gRm9yIGV4YW1wbGUsIHRha2UgdW5pZmllZCBpdHNlbGY6IGl04oCZcyBmcm96ZW4uXG4gIC8vIFBsdWdpbnMgc2hvdWxkIG5vdCBiZSBhZGRlZCB0byBpdC5cbiAgLy8gUmF0aGVyLCBpdCBzaG91bGQgYmUgZXh0ZW5kZWQsIGJ5IGludm9raW5nIGl0LCBiZWZvcmUgbW9kaWZ5aW5nIGl0LlxuICAvL1xuICAvLyBJbiBlc3NlbmNlLCBhbHdheXMgaW52b2tlIHRoaXMgd2hlbiBleHBvcnRpbmcgYSBwcm9jZXNzb3IuXG4gIGZ1bmN0aW9uIGZyZWV6ZSgpIHtcbiAgICB2YXIgdmFsdWVzXG4gICAgdmFyIHRyYW5zZm9ybWVyXG5cbiAgICBpZiAoZnJvemVuKSB7XG4gICAgICByZXR1cm4gcHJvY2Vzc29yXG4gICAgfVxuXG4gICAgd2hpbGUgKCsrZnJlZXplSW5kZXggPCBhdHRhY2hlcnMubGVuZ3RoKSB7XG4gICAgICB2YWx1ZXMgPSBhdHRhY2hlcnNbZnJlZXplSW5kZXhdXG5cbiAgICAgIGlmICh2YWx1ZXNbMV0gPT09IGZhbHNlKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGlmICh2YWx1ZXNbMV0gPT09IHRydWUpIHtcbiAgICAgICAgdmFsdWVzWzFdID0gdW5kZWZpbmVkXG4gICAgICB9XG5cbiAgICAgIHRyYW5zZm9ybWVyID0gdmFsdWVzWzBdLmFwcGx5KHByb2Nlc3NvciwgdmFsdWVzLnNsaWNlKDEpKVxuXG4gICAgICBpZiAodHlwZW9mIHRyYW5zZm9ybWVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyYW5zZm9ybWVycy51c2UodHJhbnNmb3JtZXIpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnJvemVuID0gdHJ1ZVxuICAgIGZyZWV6ZUluZGV4ID0gSW5maW5pdHlcblxuICAgIHJldHVybiBwcm9jZXNzb3JcbiAgfVxuXG4gIC8vIERhdGEgbWFuYWdlbWVudC5cbiAgLy8gR2V0dGVyIC8gc2V0dGVyIGZvciBwcm9jZXNzb3Itc3BlY2lmaWMgaW5mb3JtdGlvbi5cbiAgZnVuY3Rpb24gZGF0YShrZXksIHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBTZXQgYGtleWAuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICBhc3NlcnRVbmZyb3plbignZGF0YScsIGZyb3plbilcbiAgICAgICAgbmFtZXNwYWNlW2tleV0gPSB2YWx1ZVxuICAgICAgICByZXR1cm4gcHJvY2Vzc29yXG4gICAgICB9XG5cbiAgICAgIC8vIEdldCBga2V5YC5cbiAgICAgIHJldHVybiAob3duLmNhbGwobmFtZXNwYWNlLCBrZXkpICYmIG5hbWVzcGFjZVtrZXldKSB8fCBudWxsXG4gICAgfVxuXG4gICAgLy8gU2V0IHNwYWNlLlxuICAgIGlmIChrZXkpIHtcbiAgICAgIGFzc2VydFVuZnJvemVuKCdkYXRhJywgZnJvemVuKVxuICAgICAgbmFtZXNwYWNlID0ga2V5XG4gICAgICByZXR1cm4gcHJvY2Vzc29yXG4gICAgfVxuXG4gICAgLy8gR2V0IHNwYWNlLlxuICAgIHJldHVybiBuYW1lc3BhY2VcbiAgfVxuXG4gIC8vIFBsdWdpbiBtYW5hZ2VtZW50LlxuICAvL1xuICAvLyBQYXNzIGl0OlxuICAvLyAqICAgYW4gYXR0YWNoZXIgYW5kIG9wdGlvbnMsXG4gIC8vICogICBhIHByZXNldCxcbiAgLy8gKiAgIGEgbGlzdCBvZiBwcmVzZXRzLCBhdHRhY2hlcnMsIGFuZCBhcmd1bWVudHMgKGxpc3Qgb2YgYXR0YWNoZXJzIGFuZFxuICAvLyAgICAgb3B0aW9ucykuXG4gIGZ1bmN0aW9uIHVzZSh2YWx1ZSkge1xuICAgIHZhciBzZXR0aW5nc1xuXG4gICAgYXNzZXJ0VW5mcm96ZW4oJ3VzZScsIGZyb3plbilcblxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBFbXB0eS5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYWRkUGx1Z2luLmFwcGx5KG51bGwsIGFyZ3VtZW50cylcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmICgnbGVuZ3RoJyBpbiB2YWx1ZSkge1xuICAgICAgICBhZGRMaXN0KHZhbHVlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWRkUHJlc2V0KHZhbHVlKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIHVzYWJsZSB2YWx1ZSwgbm90IGAnICsgdmFsdWUgKyAnYCcpXG4gICAgfVxuXG4gICAgaWYgKHNldHRpbmdzKSB7XG4gICAgICBuYW1lc3BhY2Uuc2V0dGluZ3MgPSBleHRlbmQobmFtZXNwYWNlLnNldHRpbmdzIHx8IHt9LCBzZXR0aW5ncylcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc29yXG5cbiAgICBmdW5jdGlvbiBhZGRQcmVzZXQocmVzdWx0KSB7XG4gICAgICBhZGRMaXN0KHJlc3VsdC5wbHVnaW5zKVxuXG4gICAgICBpZiAocmVzdWx0LnNldHRpbmdzKSB7XG4gICAgICAgIHNldHRpbmdzID0gZXh0ZW5kKHNldHRpbmdzIHx8IHt9LCByZXN1bHQuc2V0dGluZ3MpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkKHZhbHVlKSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGFkZFBsdWdpbih2YWx1ZSlcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoJ2xlbmd0aCcgaW4gdmFsdWUpIHtcbiAgICAgICAgICBhZGRQbHVnaW4uYXBwbHkobnVsbCwgdmFsdWUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWRkUHJlc2V0KHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIHVzYWJsZSB2YWx1ZSwgbm90IGAnICsgdmFsdWUgKyAnYCcpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkTGlzdChwbHVnaW5zKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMVxuXG4gICAgICBpZiAocGx1Z2lucyA9PT0gbnVsbCB8fCBwbHVnaW5zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gRW1wdHkuXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAnb2JqZWN0JyAmJiAnbGVuZ3RoJyBpbiBwbHVnaW5zKSB7XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgcGx1Z2lucy5sZW5ndGgpIHtcbiAgICAgICAgICBhZGQocGx1Z2luc1tpbmRleF0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgYSBsaXN0IG9mIHBsdWdpbnMsIG5vdCBgJyArIHBsdWdpbnMgKyAnYCcpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkUGx1Z2luKHBsdWdpbiwgdmFsdWUpIHtcbiAgICAgIHZhciBlbnRyeSA9IGZpbmQocGx1Z2luKVxuXG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgaWYgKHBsYWluKGVudHJ5WzFdKSAmJiBwbGFpbih2YWx1ZSkpIHtcbiAgICAgICAgICB2YWx1ZSA9IGV4dGVuZCh0cnVlLCBlbnRyeVsxXSwgdmFsdWUpXG4gICAgICAgIH1cblxuICAgICAgICBlbnRyeVsxXSA9IHZhbHVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdHRhY2hlcnMucHVzaChzbGljZS5jYWxsKGFyZ3VtZW50cykpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmluZChwbHVnaW4pIHtcbiAgICB2YXIgaW5kZXggPSAtMVxuXG4gICAgd2hpbGUgKCsraW5kZXggPCBhdHRhY2hlcnMubGVuZ3RoKSB7XG4gICAgICBpZiAoYXR0YWNoZXJzW2luZGV4XVswXSA9PT0gcGx1Z2luKSB7XG4gICAgICAgIHJldHVybiBhdHRhY2hlcnNbaW5kZXhdXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUGFyc2UgYSBmaWxlIChpbiBzdHJpbmcgb3IgdmZpbGUgcmVwcmVzZW50YXRpb24pIGludG8gYSB1bmlzdCBub2RlIHVzaW5nXG4gIC8vIHRoZSBgUGFyc2VyYCBvbiB0aGUgcHJvY2Vzc29yLlxuICBmdW5jdGlvbiBwYXJzZShkb2MpIHtcbiAgICB2YXIgZmlsZSA9IHZmaWxlKGRvYylcbiAgICB2YXIgUGFyc2VyXG5cbiAgICBmcmVlemUoKVxuICAgIFBhcnNlciA9IHByb2Nlc3Nvci5QYXJzZXJcbiAgICBhc3NlcnRQYXJzZXIoJ3BhcnNlJywgUGFyc2VyKVxuXG4gICAgaWYgKG5ld2FibGUoUGFyc2VyLCAncGFyc2UnKSkge1xuICAgICAgcmV0dXJuIG5ldyBQYXJzZXIoU3RyaW5nKGZpbGUpLCBmaWxlKS5wYXJzZSgpXG4gICAgfVxuXG4gICAgcmV0dXJuIFBhcnNlcihTdHJpbmcoZmlsZSksIGZpbGUpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuICB9XG5cbiAgLy8gUnVuIHRyYW5zZm9ybXMgb24gYSB1bmlzdCBub2RlIHJlcHJlc2VudGF0aW9uIG9mIGEgZmlsZSAoaW4gc3RyaW5nIG9yXG4gIC8vIHZmaWxlIHJlcHJlc2VudGF0aW9uKSwgYXN5bmMuXG4gIGZ1bmN0aW9uIHJ1bihub2RlLCBmaWxlLCBjYikge1xuICAgIGFzc2VydE5vZGUobm9kZSlcbiAgICBmcmVlemUoKVxuXG4gICAgaWYgKCFjYiAmJiB0eXBlb2YgZmlsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSBmaWxlXG4gICAgICBmaWxlID0gbnVsbFxuICAgIH1cblxuICAgIGlmICghY2IpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShleGVjdXRvcilcbiAgICB9XG5cbiAgICBleGVjdXRvcihudWxsLCBjYilcblxuICAgIGZ1bmN0aW9uIGV4ZWN1dG9yKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdHJhbnNmb3JtZXJzLnJ1bihub2RlLCB2ZmlsZShmaWxlKSwgZG9uZSlcblxuICAgICAgZnVuY3Rpb24gZG9uZShlcnJvciwgdHJlZSwgZmlsZSkge1xuICAgICAgICB0cmVlID0gdHJlZSB8fCBub2RlXG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIHJlamVjdChlcnJvcilcbiAgICAgICAgfSBlbHNlIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgcmVzb2x2ZSh0cmVlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNiKG51bGwsIHRyZWUsIGZpbGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBSdW4gdHJhbnNmb3JtcyBvbiBhIHVuaXN0IG5vZGUgcmVwcmVzZW50YXRpb24gb2YgYSBmaWxlIChpbiBzdHJpbmcgb3JcbiAgLy8gdmZpbGUgcmVwcmVzZW50YXRpb24pLCBzeW5jLlxuICBmdW5jdGlvbiBydW5TeW5jKG5vZGUsIGZpbGUpIHtcbiAgICB2YXIgcmVzdWx0XG4gICAgdmFyIGNvbXBsZXRlXG5cbiAgICBydW4obm9kZSwgZmlsZSwgZG9uZSlcblxuICAgIGFzc2VydERvbmUoJ3J1blN5bmMnLCAncnVuJywgY29tcGxldGUpXG5cbiAgICByZXR1cm4gcmVzdWx0XG5cbiAgICBmdW5jdGlvbiBkb25lKGVycm9yLCB0cmVlKSB7XG4gICAgICBjb21wbGV0ZSA9IHRydWVcbiAgICAgIHJlc3VsdCA9IHRyZWVcbiAgICAgIGJhaWwoZXJyb3IpXG4gICAgfVxuICB9XG5cbiAgLy8gU3RyaW5naWZ5IGEgdW5pc3Qgbm9kZSByZXByZXNlbnRhdGlvbiBvZiBhIGZpbGUgKGluIHN0cmluZyBvciB2ZmlsZVxuICAvLyByZXByZXNlbnRhdGlvbikgaW50byBhIHN0cmluZyB1c2luZyB0aGUgYENvbXBpbGVyYCBvbiB0aGUgcHJvY2Vzc29yLlxuICBmdW5jdGlvbiBzdHJpbmdpZnkobm9kZSwgZG9jKSB7XG4gICAgdmFyIGZpbGUgPSB2ZmlsZShkb2MpXG4gICAgdmFyIENvbXBpbGVyXG5cbiAgICBmcmVlemUoKVxuICAgIENvbXBpbGVyID0gcHJvY2Vzc29yLkNvbXBpbGVyXG4gICAgYXNzZXJ0Q29tcGlsZXIoJ3N0cmluZ2lmeScsIENvbXBpbGVyKVxuICAgIGFzc2VydE5vZGUobm9kZSlcblxuICAgIGlmIChuZXdhYmxlKENvbXBpbGVyLCAnY29tcGlsZScpKSB7XG4gICAgICByZXR1cm4gbmV3IENvbXBpbGVyKG5vZGUsIGZpbGUpLmNvbXBpbGUoKVxuICAgIH1cblxuICAgIHJldHVybiBDb21waWxlcihub2RlLCBmaWxlKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5ldy1jYXBcbiAgfVxuXG4gIC8vIFBhcnNlIGEgZmlsZSAoaW4gc3RyaW5nIG9yIHZmaWxlIHJlcHJlc2VudGF0aW9uKSBpbnRvIGEgdW5pc3Qgbm9kZSB1c2luZ1xuICAvLyB0aGUgYFBhcnNlcmAgb24gdGhlIHByb2Nlc3NvciwgdGhlbiBydW4gdHJhbnNmb3JtcyBvbiB0aGF0IG5vZGUsIGFuZFxuICAvLyBjb21waWxlIHRoZSByZXN1bHRpbmcgbm9kZSB1c2luZyB0aGUgYENvbXBpbGVyYCBvbiB0aGUgcHJvY2Vzc29yLCBhbmRcbiAgLy8gc3RvcmUgdGhhdCByZXN1bHQgb24gdGhlIHZmaWxlLlxuICBmdW5jdGlvbiBwcm9jZXNzKGRvYywgY2IpIHtcbiAgICBmcmVlemUoKVxuICAgIGFzc2VydFBhcnNlcigncHJvY2VzcycsIHByb2Nlc3Nvci5QYXJzZXIpXG4gICAgYXNzZXJ0Q29tcGlsZXIoJ3Byb2Nlc3MnLCBwcm9jZXNzb3IuQ29tcGlsZXIpXG5cbiAgICBpZiAoIWNiKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZXhlY3V0b3IpXG4gICAgfVxuXG4gICAgZXhlY3V0b3IobnVsbCwgY2IpXG5cbiAgICBmdW5jdGlvbiBleGVjdXRvcihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciBmaWxlID0gdmZpbGUoZG9jKVxuXG4gICAgICBwaXBlbGluZS5ydW4ocHJvY2Vzc29yLCB7ZmlsZTogZmlsZX0sIGRvbmUpXG5cbiAgICAgIGZ1bmN0aW9uIGRvbmUoZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICB9IGVsc2UgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICByZXNvbHZlKGZpbGUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2IobnVsbCwgZmlsZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFByb2Nlc3MgdGhlIGdpdmVuIGRvY3VtZW50IChpbiBzdHJpbmcgb3IgdmZpbGUgcmVwcmVzZW50YXRpb24pLCBzeW5jLlxuICBmdW5jdGlvbiBwcm9jZXNzU3luYyhkb2MpIHtcbiAgICB2YXIgZmlsZVxuICAgIHZhciBjb21wbGV0ZVxuXG4gICAgZnJlZXplKClcbiAgICBhc3NlcnRQYXJzZXIoJ3Byb2Nlc3NTeW5jJywgcHJvY2Vzc29yLlBhcnNlcilcbiAgICBhc3NlcnRDb21waWxlcigncHJvY2Vzc1N5bmMnLCBwcm9jZXNzb3IuQ29tcGlsZXIpXG4gICAgZmlsZSA9IHZmaWxlKGRvYylcblxuICAgIHByb2Nlc3MoZmlsZSwgZG9uZSlcblxuICAgIGFzc2VydERvbmUoJ3Byb2Nlc3NTeW5jJywgJ3Byb2Nlc3MnLCBjb21wbGV0ZSlcblxuICAgIHJldHVybiBmaWxlXG5cbiAgICBmdW5jdGlvbiBkb25lKGVycm9yKSB7XG4gICAgICBjb21wbGV0ZSA9IHRydWVcbiAgICAgIGJhaWwoZXJyb3IpXG4gICAgfVxuICB9XG59XG5cbi8vIENoZWNrIGlmIGB2YWx1ZWAgaXMgYSBjb25zdHJ1Y3Rvci5cbmZ1bmN0aW9uIG5ld2FibGUodmFsdWUsIG5hbWUpIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICB2YWx1ZS5wcm90b3R5cGUgJiZcbiAgICAvLyBBIGZ1bmN0aW9uIHdpdGgga2V5cyBpbiBpdHMgcHJvdG90eXBlIGlzIHByb2JhYmx5IGEgY29uc3RydWN0b3IuXG4gICAgLy8gQ2xhc3Nlc+KAmSBwcm90b3R5cGUgbWV0aG9kcyBhcmUgbm90IGVudW1lcmFibGUsIHNvIHdlIGNoZWNrIGlmIHNvbWUgdmFsdWVcbiAgICAvLyBleGlzdHMgaW4gdGhlIHByb3RvdHlwZS5cbiAgICAoa2V5cyh2YWx1ZS5wcm90b3R5cGUpIHx8IG5hbWUgaW4gdmFsdWUucHJvdG90eXBlKVxuICApXG59XG5cbi8vIENoZWNrIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0IHdpdGgga2V5cy5cbmZ1bmN0aW9uIGtleXModmFsdWUpIHtcbiAgdmFyIGtleVxuICBmb3IgKGtleSBpbiB2YWx1ZSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICByZXR1cm4gZmFsc2Vcbn1cblxuLy8gQXNzZXJ0IGEgcGFyc2VyIGlzIGF2YWlsYWJsZS5cbmZ1bmN0aW9uIGFzc2VydFBhcnNlcihuYW1lLCBQYXJzZXIpIHtcbiAgaWYgKHR5cGVvZiBQYXJzZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBgJyArIG5hbWUgKyAnYCB3aXRob3V0IGBQYXJzZXJgJylcbiAgfVxufVxuXG4vLyBBc3NlcnQgYSBjb21waWxlciBpcyBhdmFpbGFibGUuXG5mdW5jdGlvbiBhc3NlcnRDb21waWxlcihuYW1lLCBDb21waWxlcikge1xuICBpZiAodHlwZW9mIENvbXBpbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgYCcgKyBuYW1lICsgJ2Agd2l0aG91dCBgQ29tcGlsZXJgJylcbiAgfVxufVxuXG4vLyBBc3NlcnQgdGhlIHByb2Nlc3NvciBpcyBub3QgZnJvemVuLlxuZnVuY3Rpb24gYXNzZXJ0VW5mcm96ZW4obmFtZSwgZnJvemVuKSB7XG4gIGlmIChmcm96ZW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQ2Fubm90IGludm9rZSBgJyArXG4gICAgICAgIG5hbWUgK1xuICAgICAgICAnYCBvbiBhIGZyb3plbiBwcm9jZXNzb3IuXFxuQ3JlYXRlIGEgbmV3IHByb2Nlc3NvciBmaXJzdCwgYnkgaW52b2tpbmcgaXQ6IHVzZSBgcHJvY2Vzc29yKClgIGluc3RlYWQgb2YgYHByb2Nlc3NvcmAuJ1xuICAgIClcbiAgfVxufVxuXG4vLyBBc3NlcnQgYG5vZGVgIGlzIGEgdW5pc3Qgbm9kZS5cbmZ1bmN0aW9uIGFzc2VydE5vZGUobm9kZSkge1xuICBpZiAoIW5vZGUgfHwgdHlwZW9mIG5vZGUudHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIG5vZGUsIGdvdCBgJyArIG5vZGUgKyAnYCcpXG4gIH1cbn1cblxuLy8gQXNzZXJ0IHRoYXQgYGNvbXBsZXRlYCBpcyBgdHJ1ZWAuXG5mdW5jdGlvbiBhc3NlcnREb25lKG5hbWUsIGFzeW5jTmFtZSwgY29tcGxldGUpIHtcbiAgaWYgKCFjb21wbGV0ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdgJyArIG5hbWUgKyAnYCBmaW5pc2hlZCBhc3luYy4gVXNlIGAnICsgYXN5bmNOYW1lICsgJ2AgaW5zdGVhZCdcbiAgICApXG4gIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0cyA9IGV4cG9ydHMuYnVpbGQgPSB2b2lkIDA7XG5jb25zdCBhbm5vdGF0ZWR0ZXh0ID0gcmVxdWlyZShcImFubm90YXRlZHRleHRcIik7XG5jb25zdCBmcm9udG1hdHRlciA9IHJlcXVpcmUoXCJyZW1hcmstZnJvbnRtYXR0ZXJcIik7XG5jb25zdCByZW1hcmtwYXJzZSA9IHJlcXVpcmUoXCJyZW1hcmstcGFyc2VcIik7XG5jb25zdCB1bmlmaWVkID0gcmVxdWlyZShcInVuaWZpZWRcIik7XG5jb25zdCBkZWZhdWx0cyA9IHtcbiAgICBjaGlsZHJlbihub2RlKSB7XG4gICAgICAgIHJldHVybiBhbm5vdGF0ZWR0ZXh0LmRlZmF1bHRzLmNoaWxkcmVuKG5vZGUpO1xuICAgIH0sXG4gICAgYW5ub3RhdGV0ZXh0bm9kZShub2RlLCB0ZXh0KSB7XG4gICAgICAgIHJldHVybiBhbm5vdGF0ZWR0ZXh0LmRlZmF1bHRzLmFubm90YXRldGV4dG5vZGUobm9kZSwgdGV4dCk7XG4gICAgfSxcbiAgICBpbnRlcnByZXRtYXJrdXAodGV4dCA9IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIFwiXFxuXCIucmVwZWF0KCh0ZXh0Lm1hdGNoKC9cXG4vZykgfHwgW10pLmxlbmd0aCk7XG4gICAgfSxcbiAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9zeW50YXgtdHJlZS9tZGFzdC11dGlsLWZyb20tbWFya2Rvd24jZnJvbW1hcmtkb3duZG9jLWVuY29kaW5nLW9wdGlvbnNcbiAgICByZW1hcmtvcHRpb25zOiB7fSxcbn07XG5leHBvcnRzLmRlZmF1bHRzID0gZGVmYXVsdHM7XG5mdW5jdGlvbiBidWlsZCh0ZXh0LCBvcHRpb25zID0gZGVmYXVsdHMpIHtcbiAgICBjb25zdCBwcm9jZXNzb3IgPSB1bmlmaWVkKClcbiAgICAgICAgLnVzZShyZW1hcmtwYXJzZSwgb3B0aW9ucy5yZW1hcmtvcHRpb25zKVxuICAgICAgICAudXNlKGZyb250bWF0dGVyLCBbXCJ5YW1sXCIsIFwidG9tbFwiXSk7XG4gICAgcmV0dXJuIGFubm90YXRlZHRleHQuYnVpbGQodGV4dCwgcHJvY2Vzc29yLnBhcnNlLCBvcHRpb25zKTtcbn1cbmV4cG9ydHMuYnVpbGQgPSBidWlsZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsImltcG9ydCAqIGFzIFJlbWFyayBmcm9tICdhbm5vdGF0ZWR0ZXh0LXJlbWFyayc7XG5pbXBvcnQgeyBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBnZXRSdWxlQ2F0ZWdvcmllcyB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBMYW5ndWFnZVRvb2xBcGkgfSBmcm9tICcuL0xhbmd1YWdlVG9vbFR5cGluZ3MnO1xuaW1wb3J0IHsgTGFuZ3VhZ2VUb29sUGx1Z2luU2V0dGluZ3MgfSBmcm9tICcuL1NldHRpbmdzVGFiJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldERldGVjdGlvblJlc3VsdChcblx0dGV4dDogc3RyaW5nLFxuXHRnZXRTZXR0aW5nczogKCkgPT4gTGFuZ3VhZ2VUb29sUGx1Z2luU2V0dGluZ3MsXG4pOiBQcm9taXNlPExhbmd1YWdlVG9vbEFwaT4ge1xuXHRjb25zdCBwYXJzZWRUZXh0ID0gUmVtYXJrLmJ1aWxkKHRleHQsIHtcblx0XHQuLi5SZW1hcmsuZGVmYXVsdHMsXG5cdFx0aW50ZXJwcmV0bWFya3VwKHRleHQgPSAnJyk6IHN0cmluZyB7XG5cdFx0XHQvLyBEb24ndCBjb2xsYXBzZSBpbmxpbmUgY29kZVxuXHRcdFx0aWYgKC9eYFteYF0rYCQvLnRlc3QodGV4dCkpIHtcblx0XHRcdFx0cmV0dXJuIHRleHQ7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAnXFxuJy5yZXBlYXQoKHRleHQubWF0Y2goL1xcbi9nKSB8fCBbXSkubGVuZ3RoKTtcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBzZXR0aW5ncyA9IGdldFNldHRpbmdzKCk7XG5cblx0Y29uc3QgeyBlbmFibGVkQ2F0ZWdvcmllcywgZGlzYWJsZWRDYXRlZ29yaWVzIH0gPSBnZXRSdWxlQ2F0ZWdvcmllcyhzZXR0aW5ncyk7XG5cblx0Y29uc3QgcGFyYW1zOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuXHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KHBhcnNlZFRleHQpLFxuXHRcdGxhbmd1YWdlOiAnYXV0bycsXG5cdFx0ZW5hYmxlZE9ubHk6ICdmYWxzZScsXG5cdFx0bGV2ZWw6IHNldHRpbmdzLnBpY2t5TW9kZSA/ICdwaWNreScgOiAnZGVmYXVsdCcsXG5cdH07XG5cblx0aWYgKGVuYWJsZWRDYXRlZ29yaWVzLmxlbmd0aCkge1xuXHRcdHBhcmFtcy5lbmFibGVkQ2F0ZWdvcmllcyA9IGVuYWJsZWRDYXRlZ29yaWVzLmpvaW4oJywnKTtcblx0fVxuXG5cdGlmIChkaXNhYmxlZENhdGVnb3JpZXMubGVuZ3RoKSB7XG5cdFx0cGFyYW1zLmRpc2FibGVkQ2F0ZWdvcmllcyA9IGRpc2FibGVkQ2F0ZWdvcmllcy5qb2luKCcsJyk7XG5cdH1cblxuXHRpZiAoc2V0dGluZ3MucnVsZU90aGVyUnVsZXMpIHtcblx0XHRwYXJhbXMuZW5hYmxlZFJ1bGVzID0gc2V0dGluZ3MucnVsZU90aGVyUnVsZXM7XG5cdH1cblxuXHRpZiAoc2V0dGluZ3MucnVsZU90aGVyRGlzYWJsZWRSdWxlcykge1xuXHRcdHBhcmFtcy5kaXNhYmxlZFJ1bGVzID0gc2V0dGluZ3MucnVsZU90aGVyRGlzYWJsZWRSdWxlcztcblx0fVxuXG5cdGlmIChzZXR0aW5ncy5hcGlrZXkgJiYgc2V0dGluZ3MudXNlcm5hbWUgJiYgc2V0dGluZ3MuYXBpa2V5Lmxlbmd0aCA+IDEgJiYgc2V0dGluZ3MudXNlcm5hbWUubGVuZ3RoID4gMSkge1xuXHRcdHBhcmFtcy51c2VybmFtZSA9IHNldHRpbmdzLnVzZXJuYW1lO1xuXHRcdHBhcmFtcy5hcGlLZXkgPSBzZXR0aW5ncy5hcGlrZXk7XG5cdH1cblxuXHRpZiAoc2V0dGluZ3Muc3RhdGljTGFuZ3VhZ2UgJiYgc2V0dGluZ3Muc3RhdGljTGFuZ3VhZ2UubGVuZ3RoID4gMCAmJiBzZXR0aW5ncy5zdGF0aWNMYW5ndWFnZSAhPT0gJ2F1dG8nKSB7XG5cdFx0cGFyYW1zLmxhbmd1YWdlID0gc2V0dGluZ3Muc3RhdGljTGFuZ3VhZ2U7XG5cdH1cblxuXHRsZXQgcmVzOiBSZXNwb25zZTtcblx0dHJ5IHtcblx0XHRyZXMgPSBhd2FpdCBmZXRjaChgJHtzZXR0aW5ncy5zZXJ2ZXJVcmx9L3YyL2NoZWNrYCwge1xuXHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRib2R5OiBPYmplY3Qua2V5cyhwYXJhbXMpXG5cdFx0XHRcdC5tYXAoa2V5ID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGtleSl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1trZXldKX1gO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQuam9pbignJicpLFxuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsXG5cdFx0XHRcdEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0fSxcblx0XHR9KTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdG5ldyBOb3RpY2UoYFJlcXVlc3QgdG8gTGFuZ3VhZ2VUb29sIHNlcnZlciBmYWlsZWQuIFBsZWFzZSBjaGVjayB5b3VyIGNvbm5lY3Rpb24gYW5kIExhbmd1YWdlVG9vbCBzZXJ2ZXIgVVJMYCwgNTAwMCk7XG5cdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KGUpO1xuXHR9XG5cblx0aWYgKCFyZXMub2spIHtcblx0XHRuZXcgTm90aWNlKGByZXF1ZXN0IHRvIExhbmd1YWdlVG9vbCBmYWlsZWRcXG4ke3Jlcy5zdGF0dXNUZXh0fWAsIDUwMDApO1xuXHRcdHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYHVuZXhwZWN0ZWQgc3RhdHVzICR7cmVzLnN0YXR1c30sIHNlZSBuZXR3b3JrIHRhYmApKTtcblx0fVxuXG5cdGxldCBib2R5OiBMYW5ndWFnZVRvb2xBcGk7XG5cdHRyeSB7XG5cdFx0Ym9keSA9IGF3YWl0IHJlcy5qc29uKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRuZXcgTm90aWNlKGBFcnJvciBwcm9jZXNzaW5nIHJlc3BvbnNlIGZyb20gTGFuZ3VhZ2VUb29sIHNlcnZlcmAsIDUwMDApO1xuXHRcdHJldHVybiBQcm9taXNlLnJlamVjdChlKTtcblx0fVxuXG5cdHJldHVybiBib2R5O1xufVxuIiwiaW1wb3J0IHsgRWRpdG9yVmlldyB9IGZyb20gJ0Bjb2RlbWlycm9yL3ZpZXcnO1xuaW1wb3J0IHsgZWRpdG9yVmlld0ZpZWxkIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IExhbmd1YWdlVG9vbFBsdWdpbiBmcm9tICdzcmMnO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRBdXRvQ2hlY2tIYW5kbGVyKHBsdWdpbjogTGFuZ3VhZ2VUb29sUGx1Z2luKSB7XG5cdGxldCBkZWJvdW5jZVRpbWVyID0gLTE7XG5cdGxldCBtaW5SYW5nZSA9IEluZmluaXR5O1xuXHRsZXQgbWF4UmFuZ2UgPSAtSW5maW5pdHk7XG5cblx0cmV0dXJuIEVkaXRvclZpZXcuaW5wdXRIYW5kbGVyLm9mKCh2aWV3LCBmcm9tLCB0bywgdGV4dCkgPT4ge1xuXHRcdGlmICghcGx1Z2luLnNldHRpbmdzLnNob3VsZEF1dG9DaGVjayB8fCAhdGV4dC50cmltKCkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBtYXJrZG93blZpZXcgPSB2aWV3LnN0YXRlLmZpZWxkKGVkaXRvclZpZXdGaWVsZCk7XG5cblx0XHRtaW5SYW5nZSA9IE1hdGgubWluKG1pblJhbmdlLCBNYXRoLm1pbihmcm9tLCB0bykpO1xuXHRcdG1heFJhbmdlID0gTWF0aC5tYXgobWF4UmFuZ2UsIE1hdGgubWF4KGZyb20sIHRvKSk7XG5cblx0XHRjbGVhclRpbWVvdXQoZGVib3VuY2VUaW1lcik7XG5cblx0XHRkZWJvdW5jZVRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0Y29uc3Qgc3RhcnRMaW5lID0gdmlldy5saW5lQmxvY2tBdChtaW5SYW5nZSk7XG5cdFx0XHRjb25zdCBlbmRMaW5lID0gdmlldy5saW5lQmxvY2tBdChtYXhSYW5nZSk7XG5cblx0XHRcdHBsdWdpbi5ydW5EZXRlY3Rpb24odmlldywgbWFya2Rvd25WaWV3LCBzdGFydExpbmUuZnJvbSwgZW5kTGluZS50bykuY2F0Y2goZSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0XHR9KTtcblx0XHRcdC8vIFRoZSBBUEkgaGFzIGEgcmF0ZSBsaW1pdCBvZiAxIHJlcXVlc3QgZXZlcnkgMyBzZWNvbmRzXG5cdFx0fSwgMzAwMCk7XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0pO1xufVxuIiwiaW1wb3J0IHsgRWRpdG9yVmlldywgRGVjb3JhdGlvbiwgRGVjb3JhdGlvblNldCB9IGZyb20gJ0Bjb2RlbWlycm9yL3ZpZXcnO1xuaW1wb3J0IHsgU3RhdGVGaWVsZCwgU3RhdGVFZmZlY3QgfSBmcm9tICdAY29kZW1pcnJvci9zdGF0ZSc7XG5pbXBvcnQgeyBzeW50YXhUcmVlIH0gZnJvbSAnQGNvZGVtaXJyb3IvbGFuZ3VhZ2UnO1xuaW1wb3J0IHsgdG9rZW5DbGFzc05vZGVQcm9wIH0gZnJvbSAnQGNvZGVtaXJyb3Ivc3RyZWFtLXBhcnNlcic7XG5pbXBvcnQgeyBUcmVlIH0gZnJvbSAnQGxlemVyL2NvbW1vbic7XG5pbXBvcnQgeyBnZXRJc3N1ZVR5cGVDbGFzc05hbWUsIGlnbm9yZUxpc3RSZWdFeCB9IGZyb20gJy4uL2hlbHBlcnMnO1xuaW1wb3J0IHsgTWF0Y2hlc0VudGl0eSB9IGZyb20gJy4uL0xhbmd1YWdlVG9vbFR5cGluZ3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFVuZGVybGluZUVmZmVjdCB7XG5cdGZyb206IG51bWJlcjtcblx0dG86IG51bWJlcjtcblx0bWF0Y2g6IE1hdGNoZXNFbnRpdHk7XG59XG5cbmV4cG9ydCBjb25zdCBhZGRVbmRlcmxpbmUgPSBTdGF0ZUVmZmVjdC5kZWZpbmU8VW5kZXJsaW5lRWZmZWN0PigpO1xuZXhwb3J0IGNvbnN0IGNsZWFyVW5kZXJsaW5lcyA9IFN0YXRlRWZmZWN0LmRlZmluZSgpO1xuZXhwb3J0IGNvbnN0IGNsZWFyVW5kZXJsaW5lc0luUmFuZ2UgPSBTdGF0ZUVmZmVjdC5kZWZpbmU8e1xuXHRmcm9tOiBudW1iZXI7XG5cdHRvOiBudW1iZXI7XG59PigpO1xuXG5mdW5jdGlvbiBmaWx0ZXJVbmRlcmxpbmVzKGRlY29yYXRpb25TdGFydDogbnVtYmVyLCBkZWNvcmF0aW9uRW5kOiBudW1iZXIsIHJhbmdlU3RhcnQ6IG51bWJlciwgcmFuZ2VFbmQ6IG51bWJlcikge1xuXHQvLyBEZWNvcmF0aW9uIGJlZ2lucyBpbiBkZWZpbmVkIHJhbmdlXG5cdGlmIChkZWNvcmF0aW9uU3RhcnQgPj0gcmFuZ2VTdGFydCAmJiBkZWNvcmF0aW9uU3RhcnQgPD0gcmFuZ2VFbmQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBEZWNvcmF0aW9uIGVuZHMgaW4gZGVmaW5lZCByYW5nZVxuXHRpZiAoZGVjb3JhdGlvbkVuZCA+PSByYW5nZVN0YXJ0ICYmIGRlY29yYXRpb25FbmQgPD0gcmFuZ2VFbmQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBEZWZpbmVkIHJhbmdlIGJlZ2lucyB3aXRoaW4gZGVjb3JhdGlvblxuXHRpZiAocmFuZ2VTdGFydCA+PSBkZWNvcmF0aW9uU3RhcnQgJiYgcmFuZ2VTdGFydCA8PSBkZWNvcmF0aW9uRW5kKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gRGVmaW5lZCByYW5nZSBlbmRzIHdpdGhpbiBkZWNvcmF0aW9uXG5cdGlmIChyYW5nZUVuZCA+PSBkZWNvcmF0aW9uU3RhcnQgJiYgcmFuZ2VFbmQgPD0gZGVjb3JhdGlvbkVuZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgY29uc3QgdW5kZXJsaW5lRmllbGQgPSBTdGF0ZUZpZWxkLmRlZmluZTxEZWNvcmF0aW9uU2V0Pih7XG5cdGNyZWF0ZSgpIHtcblx0XHRyZXR1cm4gRGVjb3JhdGlvbi5ub25lO1xuXHR9LFxuXHR1cGRhdGUodW5kZXJsaW5lcywgdHIpIHtcblx0XHRjb25zdCBzZWVuUmFuZ2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cblx0XHQvLyBNZW1vaXplIGFueSBwb3NpdGlvbnMgd2UgY2hlY2sgc28gd2UgY2FuIGF2b2lkIHNvbWUgd29ya1xuXHRcdGNvbnN0IHNlZW5Qb3NpdGlvbnM6IFJlY29yZDxudW1iZXIsIGJvb2xlYW4+ID0ge307XG5cdFx0bGV0IHRyZWU6IFRyZWUgfCBudWxsID0gbnVsbDtcblxuXHRcdHVuZGVybGluZXMgPSB1bmRlcmxpbmVzLm1hcCh0ci5jaGFuZ2VzKTtcblxuXHRcdC8vIFByZXZlbnQgZGVjb3JhdGlvbnMgaW4gY29kZWJsb2NrcywgZXRjLi4uXG5cdFx0Y29uc3QgY2FuRGVjb3JhdGUgPSAocG9zOiBudW1iZXIpID0+IHtcblx0XHRcdGlmIChzZWVuUG9zaXRpb25zW3Bvc10gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gc2VlblBvc2l0aW9uc1twb3NdO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRyZWUpIHRyZWUgPSBzeW50YXhUcmVlKHRyLnN0YXRlKTtcblxuXHRcdFx0Y29uc3Qgbm9kZVByb3BzID0gdHJlZS5yZXNvbHZlSW5uZXIocG9zLCAxKS50eXBlLnByb3AodG9rZW5DbGFzc05vZGVQcm9wKTtcblxuXHRcdFx0aWYgKG5vZGVQcm9wcyAmJiBpZ25vcmVMaXN0UmVnRXgudGVzdChub2RlUHJvcHMpKSB7XG5cdFx0XHRcdHNlZW5Qb3NpdGlvbnNbcG9zXSA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2VlblBvc2l0aW9uc1twb3NdID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNlZW5Qb3NpdGlvbnNbcG9zXTtcblx0XHR9O1xuXG5cdFx0Ly8gSWdub3JlIGNlcnRhaW4gcnVsZXMgaW4gc3BlY2lhbCBjYXNlc1xuXHRcdGNvbnN0IGlzUnVsZUFsbG93ZWQgPSAobWF0Y2g6IE1hdGNoZXNFbnRpdHksIGZyb206IG51bWJlciwgdG86IG51bWJlcikgPT4ge1xuXHRcdFx0Ly8gRG9uJ3Qgc2hvdyBzcGVsbGluZyBlcnJvcnMgZm9yIGVudHJpZXMgaW4gdGhlIHVzZXIgZGljdGlvbmFyeVxuXHRcdFx0aWYgKG1hdGNoLnJ1bGUuY2F0ZWdvcnkuaWQgPT09ICdUWVBPUycpIHtcblx0XHRcdFx0Y29uc3Qgc3BlbGxjaGVja0RpY3Rpb25hcnk6IHN0cmluZ1tdID0gKCh3aW5kb3cgYXMgYW55KS5hcHAudmF1bHQgYXMgYW55KS5nZXRDb25maWcoJ3NwZWxsY2hlY2tEaWN0aW9uYXJ5Jyk7XG5cdFx0XHRcdGNvbnN0IHN0ciA9IHRyLnN0YXRlLnNsaWNlRG9jKGZyb20sIHRvKTtcblxuXHRcdFx0XHRpZiAoc3BlbGxjaGVja0RpY3Rpb25hcnkgJiYgc3BlbGxjaGVja0RpY3Rpb25hcnkuaW5jbHVkZXMoc3RyKSkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBEb24ndCBkaXNwbGF5IHdoaXRlc3BhY2UgcnVsZXMgaW4gdGFibGVzXG5cdFx0XHRpZiAoIXRyZWUpIHRyZWUgPSBzeW50YXhUcmVlKHRyLnN0YXRlKTtcblxuXHRcdFx0Y29uc3QgbGluZU5vZGVQcm9wID0gdHJlZS5yZXNvbHZlKHRyLm5ld0RvYy5saW5lQXQoZnJvbSkuZnJvbSwgMSkudHlwZS5wcm9wKHRva2VuQ2xhc3NOb2RlUHJvcCk7XG5cblx0XHRcdGlmIChsaW5lTm9kZVByb3A/LmluY2x1ZGVzKCd0YWJsZScpKSB7XG5cdFx0XHRcdGlmIChtYXRjaC5ydWxlLmlkID09PSAnV0hJVEVTUEFDRV9SVUxFJykge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0Ly8gQ2xlYXIgb3V0IGFueSBkZWNvcmF0aW9ucyB3aGVuIHRoZWlyIGNvbnRlbnRzIGFyZSBlZGl0ZWRcblx0XHRpZiAodHIuZG9jQ2hhbmdlZCAmJiB0ci5zZWxlY3Rpb24gJiYgdW5kZXJsaW5lcy5zaXplKSB7XG5cdFx0XHR1bmRlcmxpbmVzID0gdW5kZXJsaW5lcy51cGRhdGUoe1xuXHRcdFx0XHRmaWx0ZXI6IChmcm9tLCB0bykgPT4ge1xuXHRcdFx0XHRcdHJldHVybiBmaWx0ZXJVbmRlcmxpbmVzKGZyb20sIHRvLCB0ci5zZWxlY3Rpb24hLm1haW4uZnJvbSwgdHIuc2VsZWN0aW9uIS5tYWluLnRvKTtcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgZSBvZiB0ci5lZmZlY3RzKSB7XG5cdFx0XHRpZiAoZS5pcyhhZGRVbmRlcmxpbmUpKSB7XG5cdFx0XHRcdGNvbnN0IHsgZnJvbSwgdG8sIG1hdGNoIH0gPSBlLnZhbHVlO1xuXHRcdFx0XHRjb25zdCBrZXkgPSBgJHtmcm9tfSR7dG99YDtcblxuXHRcdFx0XHRpZiAoIXNlZW5SYW5nZXMuaGFzKGtleSkgJiYgY2FuRGVjb3JhdGUoZnJvbSkgJiYgY2FuRGVjb3JhdGUodG8pICYmIGlzUnVsZUFsbG93ZWQobWF0Y2gsIGZyb20sIHRvKSkge1xuXHRcdFx0XHRcdHNlZW5SYW5nZXMuYWRkKGtleSk7XG5cdFx0XHRcdFx0dW5kZXJsaW5lcyA9IHVuZGVybGluZXMudXBkYXRlKHtcblx0XHRcdFx0XHRcdGFkZDogW1xuXHRcdFx0XHRcdFx0XHREZWNvcmF0aW9uLm1hcmsoe1xuXHRcdFx0XHRcdFx0XHRcdGNsYXNzOiBgbHQtdW5kZXJsaW5lICR7Z2V0SXNzdWVUeXBlQ2xhc3NOYW1lKG1hdGNoLnJ1bGUuY2F0ZWdvcnkuaWQpfWAsXG5cdFx0XHRcdFx0XHRcdFx0bWF0Y2gsXG5cdFx0XHRcdFx0XHRcdH0pLnJhbmdlKGZyb20sIHRvKSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoZS5pcyhjbGVhclVuZGVybGluZXMpKSB7XG5cdFx0XHRcdHVuZGVybGluZXMgPSBEZWNvcmF0aW9uLm5vbmU7XG5cdFx0XHR9IGVsc2UgaWYgKGUuaXMoY2xlYXJVbmRlcmxpbmVzSW5SYW5nZSkpIHtcblx0XHRcdFx0dW5kZXJsaW5lcyA9IHVuZGVybGluZXMudXBkYXRlKHtcblx0XHRcdFx0XHRmaWx0ZXI6IChmcm9tLCB0bykgPT4gZmlsdGVyVW5kZXJsaW5lcyhmcm9tLCB0bywgZS52YWx1ZS5mcm9tLCBlLnZhbHVlLnRvKSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVuZGVybGluZXM7XG5cdH0sXG5cdHByb3ZpZGU6IGYgPT4gRWRpdG9yVmlldy5kZWNvcmF0aW9ucy5mcm9tKGYpLFxufSk7XG4iLCJpbXBvcnQgeyBUb29sdGlwLCBzaG93VG9vbHRpcCB9IGZyb20gJ0Bjb2RlbWlycm9yL3Rvb2x0aXAnO1xuaW1wb3J0IHsgRWRpdG9yVmlldyB9IGZyb20gJ0Bjb2RlbWlycm9yL3ZpZXcnO1xuaW1wb3J0IHsgU3RhdGVGaWVsZCwgRWRpdG9yU3RhdGUgfSBmcm9tICdAY29kZW1pcnJvci9zdGF0ZSc7XG5pbXBvcnQgeyBnZXRJc3N1ZVR5cGVDbGFzc05hbWUgfSBmcm9tICcuLi9oZWxwZXJzJztcbmltcG9ydCB7IHNldEljb24gfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgTGFuZ3VhZ2VUb29sUGx1Z2luIGZyb20gJ3NyYyc7XG5pbXBvcnQgeyBVbmRlcmxpbmVFZmZlY3QsIGNsZWFyVW5kZXJsaW5lc0luUmFuZ2UsIHVuZGVybGluZUZpZWxkIH0gZnJvbSAnLi91bmRlcmxpbmVTdGF0ZUZpZWxkJztcblxuZnVuY3Rpb24gY29udHJ1Y3RUb29sdGlwKHBsdWdpbjogTGFuZ3VhZ2VUb29sUGx1Z2luLCB2aWV3OiBFZGl0b3JWaWV3LCB1bmRlcmxpbmU6IFVuZGVybGluZUVmZmVjdCkge1xuXHRjb25zdCBtYXRjaCA9IHVuZGVybGluZS5tYXRjaDtcblx0Y29uc3QgbWVzc2FnZSA9IG1hdGNoLm1lc3NhZ2U7XG5cdGNvbnN0IHRpdGxlID0gbWF0Y2guc2hvcnRNZXNzYWdlO1xuXHRjb25zdCBidXR0b25zID0gKG1hdGNoLnJlcGxhY2VtZW50cyB8fCBbXSlcblx0XHQuc2xpY2UoMCwgMylcblx0XHQubWFwKHYgPT4gdi52YWx1ZSlcblx0XHQuZmlsdGVyKHYgPT4gdi50cmltKCkpO1xuXHRjb25zdCBjYXRlZ29yeSA9IG1hdGNoLnJ1bGUuY2F0ZWdvcnkuaWQ7XG5cblx0Y29uc3QgbWFpbkNsYXNzID0gcGx1Z2luLnNldHRpbmdzLmdsYXNzQmcgPyAnbHQtcHJlZGljdGlvbnMtY29udGFpbmVyLWdsYXNzJyA6ICdsdC1wcmVkaWN0aW9ucy1jb250YWluZXInO1xuXG5cdHJldHVybiBjcmVhdGVEaXYoeyBjbHM6IFttYWluQ2xhc3MsIGdldElzc3VlVHlwZUNsYXNzTmFtZShjYXRlZ29yeSldIH0sIHJvb3QgPT4ge1xuXHRcdGlmICh0aXRsZSkge1xuXHRcdFx0cm9vdC5jcmVhdGVTcGFuKHsgY2xzOiAnbHQtdGl0bGUnIH0sIHNwYW4gPT4ge1xuXHRcdFx0XHRzcGFuLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0aXRsZSB9KTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChtZXNzYWdlKSB7XG5cdFx0XHRyb290LmNyZWF0ZVNwYW4oeyBjbHM6ICdsdC1tZXNzYWdlJywgdGV4dDogbWVzc2FnZSB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBjbGVhclVuZGVybGluZUVmZmVjdCA9IGNsZWFyVW5kZXJsaW5lc0luUmFuZ2Uub2Yoe1xuXHRcdFx0ZnJvbTogdmlldy5zdGF0ZS5zZWxlY3Rpb24ubWFpbi5mcm9tLFxuXHRcdFx0dG86IHZpZXcuc3RhdGUuc2VsZWN0aW9uLm1haW4udG8sXG5cdFx0fSk7XG5cblx0XHRpZiAoYnV0dG9ucy5sZW5ndGgpIHtcblx0XHRcdHJvb3QuY3JlYXRlRGl2KHsgY2xzOiAnbHQtYnV0dG9uY29udGFpbmVyJyB9LCBidXR0b25Db250YWluZXIgPT4ge1xuXHRcdFx0XHRmb3IgKGNvbnN0IGJ0blRleHQgb2YgYnV0dG9ucykge1xuXHRcdFx0XHRcdGJ1dHRvbkNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiBidG5UZXh0IH0sIGJ1dHRvbiA9PiB7XG5cdFx0XHRcdFx0XHRidXR0b24ub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0dmlldy5kaXNwYXRjaCh7XG5cdFx0XHRcdFx0XHRcdFx0Y2hhbmdlczogW1xuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRmcm9tOiB1bmRlcmxpbmUuZnJvbSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0dG86IHVuZGVybGluZS50byxcblx0XHRcdFx0XHRcdFx0XHRcdFx0aW5zZXJ0OiBidG5UZXh0LFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHRcdGVmZmVjdHM6IFtjbGVhclVuZGVybGluZUVmZmVjdF0sXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cm9vdC5jcmVhdGVEaXYoeyBjbHM6ICdsdC1pZ25vcmVjb250YWluZXInIH0sIGNvbnRhaW5lciA9PiB7XG5cdFx0XHRjb250YWluZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnbHQtaWdub3JlLWJ0bicgfSwgYnV0dG9uID0+IHtcblx0XHRcdFx0aWYgKGNhdGVnb3J5ID09PSAnVFlQT1MnKSB7XG5cdFx0XHRcdFx0c2V0SWNvbihidXR0b24uY3JlYXRlU3BhbigpLCAncGx1cy13aXRoLWNpcmNsZScpO1xuXHRcdFx0XHRcdGJ1dHRvbi5jcmVhdGVTcGFuKHsgdGV4dDogJ0FkZCB0byBwZXJzb25hbCBkaWN0aW9uYXJ5JyB9KTtcblx0XHRcdFx0XHRidXR0b24ub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHNwZWxsY2hlY2tEaWN0aW9uYXJ5OiBzdHJpbmdbXSA9IChwbHVnaW4uYXBwLnZhdWx0IGFzIGFueSkuZ2V0Q29uZmlnKCdzcGVsbGNoZWNrRGljdGlvbmFyeScpIHx8IFtdO1xuXG5cdFx0XHRcdFx0XHQocGx1Z2luLmFwcC52YXVsdCBhcyBhbnkpLnNldENvbmZpZygnc3BlbGxjaGVja0RpY3Rpb25hcnknLCBbXG5cdFx0XHRcdFx0XHRcdC4uLnNwZWxsY2hlY2tEaWN0aW9uYXJ5LFxuXHRcdFx0XHRcdFx0XHR2aWV3LnN0YXRlLnNsaWNlRG9jKHVuZGVybGluZS5mcm9tLCB1bmRlcmxpbmUudG8pLFxuXHRcdFx0XHRcdFx0XSk7XG5cblx0XHRcdFx0XHRcdHZpZXcuZGlzcGF0Y2goe1xuXHRcdFx0XHRcdFx0XHRlZmZlY3RzOiBbY2xlYXJVbmRlcmxpbmVFZmZlY3RdLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZXRJY29uKGJ1dHRvbi5jcmVhdGVTcGFuKCksICdjcm9zcycpO1xuXHRcdFx0XHRcdGJ1dHRvbi5jcmVhdGVTcGFuKHsgdGV4dDogJ0lnbm9yZSBzdWdnZXN0aW9uJyB9KTtcblx0XHRcdFx0XHRidXR0b24ub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRcdHZpZXcuZGlzcGF0Y2goe1xuXHRcdFx0XHRcdFx0XHRlZmZlY3RzOiBbY2xlYXJVbmRlcmxpbmVFZmZlY3RdLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBnZXRUb29sdGlwKHRvb2x0aXBzOiByZWFkb25seSBUb29sdGlwW10sIHBsdWdpbjogTGFuZ3VhZ2VUb29sUGx1Z2luLCBzdGF0ZTogRWRpdG9yU3RhdGUpOiByZWFkb25seSBUb29sdGlwW10ge1xuXHRjb25zdCB1bmRlcmxpbmVzID0gc3RhdGUuZmllbGQodW5kZXJsaW5lRmllbGQpO1xuXG5cdGlmICh1bmRlcmxpbmVzLnNpemUgPT09IDAgfHwgc3RhdGUuc2VsZWN0aW9uLnJhbmdlcy5sZW5ndGggPiAxKSB7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cblx0bGV0IHByaW1hcnlVbmRlcmxpbmU6IFVuZGVybGluZUVmZmVjdCB8IG51bGwgPSBudWxsO1xuXG5cdHVuZGVybGluZXMuYmV0d2VlbihzdGF0ZS5zZWxlY3Rpb24ubWFpbi5mcm9tLCBzdGF0ZS5zZWxlY3Rpb24ubWFpbi50bywgKGZyb20sIHRvLCB2YWx1ZSkgPT4ge1xuXHRcdHByaW1hcnlVbmRlcmxpbmUgPSB7XG5cdFx0XHRmcm9tLFxuXHRcdFx0dG8sXG5cdFx0XHRtYXRjaDogdmFsdWUuc3BlYy5tYXRjaCxcblx0XHR9IGFzIFVuZGVybGluZUVmZmVjdDtcblx0fSk7XG5cblx0aWYgKHByaW1hcnlVbmRlcmxpbmUgIT09IG51bGwpIHtcblx0XHRjb25zdCB7IGZyb20sIHRvIH0gPSBwcmltYXJ5VW5kZXJsaW5lIGFzIFVuZGVybGluZUVmZmVjdDtcblxuXHRcdGlmICh0b29sdGlwcy5sZW5ndGgpIHtcblx0XHRcdGNvbnN0IHRvb2x0aXAgPSB0b29sdGlwc1swXTtcblxuXHRcdFx0aWYgKHRvb2x0aXAucG9zID09PSBmcm9tICYmIHRvb2x0aXAuZW5kID09PSB0bykge1xuXHRcdFx0XHRyZXR1cm4gdG9vbHRpcHM7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFtcblx0XHRcdHtcblx0XHRcdFx0cG9zOiBmcm9tLFxuXHRcdFx0XHRlbmQ6IHRvLFxuXHRcdFx0XHRhYm92ZTogdHJ1ZSxcblx0XHRcdFx0c3RyaWN0U2lkZTogZmFsc2UsXG5cdFx0XHRcdGFycm93OiBmYWxzZSxcblx0XHRcdFx0Y3JlYXRlOiB2aWV3ID0+IHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZG9tOiBjb250cnVjdFRvb2x0aXAocGx1Z2luLCB2aWV3LCBwcmltYXJ5VW5kZXJsaW5lIGFzIFVuZGVybGluZUVmZmVjdCksXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XTtcblx0fVxuXG5cdHJldHVybiBbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkVG9vbHRpcEZpZWxkKHBsdWdpbjogTGFuZ3VhZ2VUb29sUGx1Z2luKSB7XG5cdHJldHVybiBTdGF0ZUZpZWxkLmRlZmluZTxyZWFkb25seSBUb29sdGlwW10+KHtcblx0XHRjcmVhdGU6IHN0YXRlID0+IGdldFRvb2x0aXAoW10sIHBsdWdpbiwgc3RhdGUpLFxuXHRcdHVwZGF0ZTogKHRvb2x0aXBzLCB0cikgPT4gZ2V0VG9vbHRpcCh0b29sdGlwcywgcGx1Z2luLCB0ci5zdGF0ZSksXG5cdFx0cHJvdmlkZTogZiA9PiBzaG93VG9vbHRpcC5jb21wdXRlTihbZl0sIHN0YXRlID0+IHN0YXRlLmZpZWxkKGYpKSxcblx0fSk7XG59XG4iLCJpbXBvcnQgeyBzZXRJY29uIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgZ2V0SXNzdWVUeXBlQ2xhc3NOYW1lIH0gZnJvbSAnLi4vaGVscGVycyc7XG5pbXBvcnQgeyBNYXRjaGVzRW50aXR5IH0gZnJvbSAnLi4vTGFuZ3VhZ2VUb29sVHlwaW5ncyc7XG5cbmludGVyZmFjZSBMZWdhY3lXaWRnZXRBcmdzIHtcblx0bWF0Y2g6IE1hdGNoZXNFbnRpdHk7XG5cdG1hdGNoZWRTdHJpbmc6IHN0cmluZztcblx0cG9zaXRpb246IHsgbGVmdDogbnVtYmVyOyBib3R0b206IG51bWJlcjsgdG9wOiBudW1iZXIgfTtcblx0b25DbGljazogKHRleHQ6IHN0cmluZykgPT4gdm9pZDtcblx0YWRkVG9EaWN0aW9uYXJ5OiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuXHRpZ25vcmVTdWdnZXN0aW9uOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgTGVnYWN5V2lkZ2V0IHtcblx0cHJpdmF0ZSByZWFkb25seSBlbGVtOiBIVE1MRWxlbWVudDtcblxuXHRwdWJsaWMgZ2V0IGVsZW1lbnQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZWxlbTtcblx0fVxuXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihhcmdzOiBMZWdhY3lXaWRnZXRBcmdzLCBjbGFzc1RvVXNlOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtZXNzYWdlID0gYXJncy5tYXRjaC5tZXNzYWdlO1xuXHRcdGNvbnN0IHRpdGxlID0gYXJncy5tYXRjaC5zaG9ydE1lc3NhZ2U7XG5cdFx0Y29uc3QgYnV0dG9ucyA9IChhcmdzLm1hdGNoLnJlcGxhY2VtZW50cyB8fCBbXSkuc2xpY2UoMCwgMykubWFwKHYgPT4gdi52YWx1ZSk7XG5cdFx0Y29uc3QgY2F0ZWdvcnkgPSBhcmdzLm1hdGNoLnJ1bGUuY2F0ZWdvcnkuaWQ7XG5cblx0XHR0aGlzLmVsZW0gPSBjcmVhdGVEaXYoeyBjbHM6IFtjbGFzc1RvVXNlLCBnZXRJc3N1ZVR5cGVDbGFzc05hbWUoY2F0ZWdvcnkpXSB9LCByb290ID0+IHtcblx0XHRcdHJvb3Quc3R5bGUuc2V0UHJvcGVydHkoJ2xlZnQnLCBgJHthcmdzLnBvc2l0aW9uLmxlZnR9cHhgKTtcblx0XHRcdHJvb3Quc3R5bGUuc2V0UHJvcGVydHkoJ3RvcCcsIGAke2FyZ3MucG9zaXRpb24uYm90dG9tfXB4YCk7XG5cblx0XHRcdGlmICh0aXRsZSkge1xuXHRcdFx0XHRyb290LmNyZWF0ZVNwYW4oeyBjbHM6ICdsdC10aXRsZScgfSwgc3BhbiA9PiB7XG5cdFx0XHRcdFx0c3Bhbi5jcmVhdGVTcGFuKHsgdGV4dDogdGl0bGUgfSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobWVzc2FnZSkge1xuXHRcdFx0XHRyb290LmNyZWF0ZVNwYW4oeyBjbHM6ICdsdC1tZXNzYWdlJywgdGV4dDogbWVzc2FnZSB9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGJ1dHRvbnMubGVuZ3RoKSB7XG5cdFx0XHRcdHJvb3QuY3JlYXRlRGl2KHsgY2xzOiAnbHQtYnV0dG9uY29udGFpbmVyJyB9LCBidXR0b25Db250YWluZXIgPT4ge1xuXHRcdFx0XHRcdGZvciAoY29uc3QgYnRuVGV4dCBvZiBidXR0b25zKSB7XG5cdFx0XHRcdFx0XHRidXR0b25Db250YWluZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogYnRuVGV4dCB9LCBidXR0b24gPT4ge1xuXHRcdFx0XHRcdFx0XHRidXR0b24ub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRhcmdzLm9uQ2xpY2soYnRuVGV4dCk7XG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyb290LmNyZWF0ZURpdih7IGNsczogJ2x0LWlnbm9yZWNvbnRhaW5lcicgfSwgY29udGFpbmVyID0+IHtcblx0XHRcdFx0Y29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2x0LWlnbm9yZS1idG4nIH0sIGJ1dHRvbiA9PiB7XG5cdFx0XHRcdFx0aWYgKGNhdGVnb3J5ID09PSAnVFlQT1MnKSB7XG5cdFx0XHRcdFx0XHRzZXRJY29uKGJ1dHRvbi5jcmVhdGVTcGFuKCksICdwbHVzLXdpdGgtY2lyY2xlJyk7XG5cdFx0XHRcdFx0XHRidXR0b24uY3JlYXRlU3Bhbih7IHRleHQ6ICdBZGQgdG8gcGVyc29uYWwgZGljdGlvbmFyeScgfSk7XG5cdFx0XHRcdFx0XHRidXR0b24ub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0YXJncy5hZGRUb0RpY3Rpb25hcnkoYXJncy5tYXRjaGVkU3RyaW5nKTtcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHNldEljb24oYnV0dG9uLmNyZWF0ZVNwYW4oKSwgJ2Nyb3NzJyk7XG5cdFx0XHRcdFx0XHRidXR0b24uY3JlYXRlU3Bhbih7IHRleHQ6ICdJZ25vcmUgc3VnZ2VzdGlvbicgfSk7XG5cdFx0XHRcdFx0XHRidXR0b24ub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0YXJncy5pZ25vcmVTdWdnZXN0aW9uKCk7XG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kKHRoaXMuZWxlbSk7XG5cblx0XHQvLyBFbnN1cmUgd2lkZ2V0IGlzIG9uIHNjcmVlblxuXHRcdGNvbnN0IGhlaWdodCA9IHRoaXMuZWxlbS5jbGllbnRIZWlnaHQ7XG5cdFx0Y29uc3Qgd2lkdGggPSB0aGlzLmVsZW0uY2xpZW50V2lkdGg7XG5cblx0XHRpZiAoYXJncy5wb3NpdGlvbi5ib3R0b20gKyBoZWlnaHQgPiB3aW5kb3cuaW5uZXJIZWlnaHQpIHtcblx0XHRcdHRoaXMuZWxlbS5zdHlsZS5zZXRQcm9wZXJ0eSgndG9wJywgYCR7YXJncy5wb3NpdGlvbi50b3AgLSBoZWlnaHR9cHhgKTtcblx0XHR9XG5cblx0XHRpZiAoYXJncy5wb3NpdGlvbi5sZWZ0ICsgd2lkdGggPiB3aW5kb3cuaW5uZXJXaWR0aCkge1xuXHRcdFx0dGhpcy5lbGVtLnN0eWxlLnNldFByb3BlcnR5KCdsZWZ0JywgYCR7d2luZG93LmlubmVyV2lkdGggLSB3aWR0aCAtIDE1fXB4YCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGRlc3Ryb3koKSB7XG5cdFx0dGhpcy5lbGVtPy5yZW1vdmUoKTtcblx0fVxufVxuIiwiaW1wb3J0IHsgaWdub3JlTGlzdFJlZ0V4IH0gZnJvbSAnc3JjL2hlbHBlcnMnO1xuaW1wb3J0IHsgTWF0Y2hlc0VudGl0eSB9IGZyb20gJ3NyYy9MYW5ndWFnZVRvb2xUeXBpbmdzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGxlZ2FjeVNob3VsZENoZWNrVGV4dEF0UG9zKGluc3RhbmNlOiBDb2RlTWlycm9yLkVkaXRvciwgcG9zOiBDb2RlTWlycm9yLlBvc2l0aW9uKSB7XG5cdC8vIEVtcHR5IGxpbmVcblx0aWYgKCFpbnN0YW5jZS5nZXRMaW5lKHBvcy5saW5lKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGNvbnN0IHRva2VucyA9IGluc3RhbmNlLmdldFRva2VuVHlwZUF0KHBvcyk7XG5cblx0Ly8gUGxhaW4gdGV4dCBsaW5lXG5cdGlmICghdG9rZW5zKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBOb3QgY29kZWJsb2NrIG9yIGZyb250bWF0dGVyXG5cdGlmICghaWdub3JlTGlzdFJlZ0V4LnRlc3QodG9rZW5zKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGVnYWN5Q2xlYXJNYXJrcyhcblx0bWFya2VyTWFwOiBNYXA8Q29kZU1pcnJvci5UZXh0TWFya2VyLCBNYXRjaGVzRW50aXR5Pixcblx0ZWRpdG9yOiBDb2RlTWlycm9yLkVkaXRvcixcblx0ZnJvbT86IENvZGVNaXJyb3IuUG9zaXRpb24sXG5cdHRvPzogQ29kZU1pcnJvci5Qb3NpdGlvbixcbikge1xuXHRjb25zdCBjbGVhck1hcmsgPSAobWFyazogQ29kZU1pcnJvci5UZXh0TWFya2VyPENvZGVNaXJyb3IuTWFya2VyUmFuZ2U+KSA9PiB7XG5cdFx0aWYgKG1hcmsuYXR0cmlidXRlcz8uaXNJZ25vcmVkKSByZXR1cm47XG5cdFx0bWFya2VyTWFwLmRlbGV0ZShtYXJrKTtcblx0XHRtYXJrLmNsZWFyKCk7XG5cdH07XG5cblx0aWYgKGZyb20gJiYgdG8pIHtcblx0XHRyZXR1cm4gZWRpdG9yLmZpbmRNYXJrcyhmcm9tLCB0bykuZm9yRWFjaChjbGVhck1hcmspO1xuXHR9XG5cblx0ZWRpdG9yLmdldEFsbE1hcmtzKCkuZm9yRWFjaChjbGVhck1hcmspO1xufVxuIiwiaW1wb3J0IHsgQXBwLCBkZWJvdW5jZSwgRGVib3VuY2VyLCBNYXJrZG93blZpZXcgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgUXVpY2tMUlUgZnJvbSAncXVpY2stbHJ1JztcbmltcG9ydCB7IGdldElzc3VlVHlwZUNsYXNzTmFtZSwgaGFzaFN0cmluZyB9IGZyb20gJy4uL2hlbHBlcnMnO1xuaW1wb3J0IHsgTGFuZ3VhZ2VUb29sQXBpLCBNYXRjaGVzRW50aXR5IH0gZnJvbSAnLi4vTGFuZ3VhZ2VUb29sVHlwaW5ncyc7XG5pbXBvcnQgeyBMZWdhY3lXaWRnZXQgfSBmcm9tICcuL0xlZ2FjeVdpZGdldCc7XG5pbXBvcnQgeyBnZXREZXRlY3Rpb25SZXN1bHQgfSBmcm9tICcuLi9hcGknO1xuaW1wb3J0IExhbmd1YWdlVG9vbFBsdWdpbiBmcm9tICdzcmMnO1xuaW1wb3J0IHsgbGVnYWN5Q2xlYXJNYXJrcywgbGVnYWN5U2hvdWxkQ2hlY2tUZXh0QXRQb3MgfSBmcm9tICcuL2hlbHBlcnMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMZWdhY3lMYW5ndWFnZVRvb2xQbHVnaW4ge1xuXHRwcml2YXRlIGhhc2hMcnU6IFF1aWNrTFJVPG51bWJlciwgTGFuZ3VhZ2VUb29sQXBpPjtcblxuXHRwcml2YXRlIGNoZWNrTGluZXM6IERlYm91bmNlcjxDb2RlTWlycm9yLkVkaXRvcltdPjtcblx0cHJpdmF0ZSBkaXJ0eUxpbmVzOiBXZWFrTWFwPENvZGVNaXJyb3IuRWRpdG9yLCBudW1iZXJbXT47XG5cdHB1YmxpYyBtYXJrZXJNYXA6IE1hcDxDb2RlTWlycm9yLlRleHRNYXJrZXIsIE1hdGNoZXNFbnRpdHk+O1xuXHRwcml2YXRlIG9wZW5XaWRnZXQ6IExlZ2FjeVdpZGdldCB8IHVuZGVmaW5lZDtcblxuXHRwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogTGFuZ3VhZ2VUb29sUGx1Z2luO1xuXHRwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwO1xuXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihwbHVnaW46IExhbmd1YWdlVG9vbFBsdWdpbikge1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHRcdHRoaXMuYXBwID0gcGx1Z2luLmFwcDtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBvbmxvYWQoKSB7XG5cdFx0dGhpcy5tYXJrZXJNYXAgPSBuZXcgTWFwPENvZGVNaXJyb3IuVGV4dE1hcmtlciwgTWF0Y2hlc0VudGl0eT4oKTtcblx0XHR0aGlzLmhhc2hMcnUgPSBuZXcgUXVpY2tMUlU8bnVtYmVyLCBMYW5ndWFnZVRvb2xBcGk+KHtcblx0XHRcdG1heFNpemU6IDEwLFxuXHRcdH0pO1xuXHRcdHRoaXMuZGlydHlMaW5lcyA9IG5ldyBXZWFrTWFwKCk7XG5cdFx0dGhpcy5jaGVja0xpbmVzID0gZGVib3VuY2UoXG5cdFx0XHR0aGlzLnJ1bkF1dG9EZXRlY3Rpb24sXG5cdFx0XHQvLyBUaGUgQVBJIGhhcyBhIHJhdGUgbGltaXQgb2YgMSByZXF1ZXN0IGV2ZXJ5IDMgc2Vjb25kc1xuXHRcdFx0MzAwMCxcblx0XHRcdHRydWUsXG5cdFx0KTtcblxuXHRcdHRoaXMuaW5pdExlZ2FjeUVkaXRvckhhbmRsZXIoKTtcblx0fVxuXG5cdHB1YmxpYyBvbnVubG9hZCgpIHtcblx0XHRpZiAodGhpcy5vcGVuV2lkZ2V0KSB7XG5cdFx0XHR0aGlzLm9wZW5XaWRnZXQuZGVzdHJveSgpO1xuXHRcdFx0dGhpcy5vcGVuV2lkZ2V0ID0gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5pdGVyYXRlQ29kZU1pcnJvcnMoY20gPT4ge1xuXHRcdFx0bGVnYWN5Q2xlYXJNYXJrcyh0aGlzLm1hcmtlck1hcCwgY20pO1xuXHRcdFx0Y20ub2ZmKCdjaGFuZ2UnLCB0aGlzLm9uQ29kZW1pcnJvckNoYW5nZSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGluaXRMZWdhY3lFZGl0b3JIYW5kbGVyKCkge1xuXHRcdHRoaXMucGx1Z2luLnJlZ2lzdGVyQ29kZU1pcnJvcihjbSA9PiB7XG5cdFx0XHRjbS5vbignY2hhbmdlJywgdGhpcy5vbkNvZGVtaXJyb3JDaGFuZ2UpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gVXNpbmcgdGhlIGNsaWNrIGV2ZW50IHdvbid0IHRyaWdnZXIgdGhlIHdpZGdldCBjb25zaXN0ZW50bHksIHNvIHVzZSBwb2ludGVydXAgaW5zdGVhZFxuXHRcdHRoaXMucGx1Z2luLnJlZ2lzdGVyRG9tRXZlbnQoZG9jdW1lbnQsICdwb2ludGVydXAnLCBlID0+IHtcblx0XHRcdGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuXHRcdFx0aWYgKCF2aWV3KSByZXR1cm47XG5cblx0XHRcdGlmIChlLnRhcmdldCA9PT0gdGhpcy5vcGVuV2lkZ2V0Py5lbGVtZW50IHx8IHRoaXMub3BlbldpZGdldD8uZWxlbWVudC5jb250YWlucyhlLnRhcmdldCBhcyBDaGlsZE5vZGUpKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRGVzdHJveSBhbnkgb3BlbiB3aWRnZXRzIGlmIHdlJ3JlIG5vdCBjbGlja2luZyBpbiBvbmVcblx0XHRcdGlmICh0aGlzLm9wZW5XaWRnZXQpIHtcblx0XHRcdFx0dGhpcy5vcGVuV2lkZ2V0LmRlc3Ryb3koKTtcblx0XHRcdFx0dGhpcy5vcGVuV2lkZ2V0ID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBEb24ndCBvcGVuIGlmIHdlIGhhdmUgbm8gbWFya3Mgb3IgYXJlbid0IGNsaWNraW5nIG9uIGEgbWFya1xuXHRcdFx0aWYgKHRoaXMubWFya2VyTWFwLnNpemUgPT09IDAgfHwgKGUudGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgIWUudGFyZ2V0Lmhhc0NsYXNzKCdsdC11bmRlcmxpbmUnKSkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBlZGl0b3IgPSAodmlldy5lZGl0b3IgYXMgYW55KS5jbTtcblxuXHRcdFx0Ly8gcmV0dXJuIGlmIGVsZW1lbnQgaXMgbm90IGluIHRoZSBlZGl0b3Jcblx0XHRcdGlmICghZWRpdG9yLmdldFdyYXBwZXJFbGVtZW50KCkuY29udGFpbnMoZS50YXJnZXQgYXMgQ2hpbGROb2RlKSkgcmV0dXJuO1xuXG5cdFx0XHRjb25zdCBsaW5lQ2ggPSBlZGl0b3IuY29vcmRzQ2hhcih7IGxlZnQ6IGUuY2xpZW50WCwgdG9wOiBlLmNsaWVudFkgfSk7XG5cdFx0XHRjb25zdCBtYXJrZXJzID0gZWRpdG9yLmZpbmRNYXJrc0F0KGxpbmVDaCk7XG5cblx0XHRcdGlmIChtYXJrZXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG5cdFx0XHQvLyBhc3N1bWUgdGhlcmUgaXMgb25seSBhIHNpbmdsZSBtYXJrZXJcblx0XHRcdGNvbnN0IG1hcmtlciA9IG1hcmtlcnNbMF07XG5cdFx0XHRjb25zdCBtYXRjaCA9IHRoaXMubWFya2VyTWFwLmdldChtYXJrZXIpO1xuXHRcdFx0aWYgKCFtYXRjaCkgcmV0dXJuO1xuXG5cdFx0XHRjb25zdCB7IGZyb20sIHRvIH0gPSBtYXJrZXIuZmluZCgpIGFzIENvZGVNaXJyb3IuTWFya2VyUmFuZ2U7XG5cdFx0XHRjb25zdCBwb3NpdGlvbiA9IGVkaXRvci5jdXJzb3JDb29yZHMoZnJvbSk7XG5cdFx0XHRjb25zdCBtYXRjaGVkU3RyaW5nID0gZWRpdG9yLmdldFJhbmdlKGZyb20sIHRvKTtcblxuXHRcdFx0dGhpcy5vcGVuV2lkZ2V0ID0gbmV3IExlZ2FjeVdpZGdldChcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG1hdGNoLFxuXHRcdFx0XHRcdG1hdGNoZWRTdHJpbmcsXG5cdFx0XHRcdFx0cG9zaXRpb24sXG5cdFx0XHRcdFx0b25DbGljazogdGV4dCA9PiB7XG5cdFx0XHRcdFx0XHRlZGl0b3IucmVwbGFjZVJhbmdlKHRleHQsIGZyb20sIHRvKTtcblxuXHRcdFx0XHRcdFx0bWFya2VyLmNsZWFyKCk7XG5cblx0XHRcdFx0XHRcdHRoaXMub3BlbldpZGdldD8uZGVzdHJveSgpO1xuXHRcdFx0XHRcdFx0dGhpcy5vcGVuV2lkZ2V0ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0YWRkVG9EaWN0aW9uYXJ5OiB0ZXh0ID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHNwZWxsY2hlY2tEaWN0aW9uYXJ5OiBzdHJpbmdbXSA9ICh0aGlzLmFwcC52YXVsdCBhcyBhbnkpLmdldENvbmZpZygnc3BlbGxjaGVja0RpY3Rpb25hcnknKSB8fCBbXTtcblx0XHRcdFx0XHRcdCh0aGlzLmFwcC52YXVsdCBhcyBhbnkpLnNldENvbmZpZygnc3BlbGxjaGVja0RpY3Rpb25hcnknLCBbLi4uc3BlbGxjaGVja0RpY3Rpb25hcnksIHRleHRdKTtcblxuXHRcdFx0XHRcdFx0bWFya2VyLmNsZWFyKCk7XG5cblx0XHRcdFx0XHRcdHRoaXMub3BlbldpZGdldD8uZGVzdHJveSgpO1xuXHRcdFx0XHRcdFx0dGhpcy5vcGVuV2lkZ2V0ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0aWdub3JlU3VnZ2VzdGlvbjogKCkgPT4ge1xuXHRcdFx0XHRcdFx0ZWRpdG9yLm1hcmtUZXh0KGZyb20sIHRvLCB7XG5cdFx0XHRcdFx0XHRcdGNsZWFyT25FbnRlcjogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdGF0dHJpYnV0ZXM6IHtcblx0XHRcdFx0XHRcdFx0XHRpc0lnbm9yZWQ6ICd0cnVlJyxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRtYXJrZXIuY2xlYXIoKTtcblxuXHRcdFx0XHRcdFx0dGhpcy5vcGVuV2lkZ2V0Py5kZXN0cm95KCk7XG5cdFx0XHRcdFx0XHR0aGlzLm9wZW5XaWRnZXQgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2xhc3NCZyA/ICdsdC1wcmVkaWN0aW9ucy1jb250YWluZXItZ2xhc3MnIDogJ2x0LXByZWRpY3Rpb25zLWNvbnRhaW5lcicsXG5cdFx0XHQpO1xuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBvbkNvZGVtaXJyb3JDaGFuZ2UgPSAoaW5zdGFuY2U6IENvZGVNaXJyb3IuRWRpdG9yLCBkZWx0YTogQ29kZU1pcnJvci5FZGl0b3JDaGFuZ2VMaW5rZWRMaXN0KSA9PiB7XG5cdFx0aWYgKHRoaXMub3BlbldpZGdldCkge1xuXHRcdFx0dGhpcy5vcGVuV2lkZ2V0LmRlc3Ryb3koKTtcblx0XHRcdHRoaXMub3BlbldpZGdldCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHQvLyBDbGVhciBtYXJrZXJzIG9uIGVkaXRcblx0XHRpZiAodGhpcy5tYXJrZXJNYXAuc2l6ZSA+IDAgJiYgZGVsdGEub3JpZ2luICYmIGRlbHRhLm9yaWdpblswXSA9PT0gJysnKSB7XG5cdFx0XHRjb25zdCBtYXJrcyA9IGluc3RhbmNlLmZpbmRNYXJrc0F0KGRlbHRhLmZyb20pO1xuXG5cdFx0XHRpZiAobWFya3MubGVuZ3RoKSB7XG5cdFx0XHRcdG1hcmtzLmZvckVhY2gobWFyayA9PiBtYXJrLmNsZWFyKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvdWxkQXV0b0NoZWNrIHx8ICFkZWx0YS5vcmlnaW4pIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZGVsdGEub3JpZ2luWzBdID09PSAnKycgfHwgZGVsdGEub3JpZ2luID09PSAncGFzdGUnKSB7XG5cdFx0XHRjb25zdCBkaXJ0eUxpbmVzOiBudW1iZXJbXSA9IHRoaXMuZGlydHlMaW5lcy5oYXMoaW5zdGFuY2UpID8gKHRoaXMuZGlydHlMaW5lcy5nZXQoaW5zdGFuY2UpIGFzIG51bWJlcltdKSA6IFtdO1xuXG5cdFx0XHRkZWx0YS50ZXh0LmZvckVhY2goKF8sIGkpID0+IHtcblx0XHRcdFx0Y29uc3QgbGluZSA9IGRlbHRhLmZyb20ubGluZSArIGk7XG5cblx0XHRcdFx0aWYgKGxlZ2FjeVNob3VsZENoZWNrVGV4dEF0UG9zKGluc3RhbmNlLCB7IC4uLmRlbHRhLmZyb20sIGxpbmUgfSkpIHtcblx0XHRcdFx0XHRkaXJ0eUxpbmVzLnB1c2gobGluZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmRpcnR5TGluZXMuc2V0KGluc3RhbmNlLCBkaXJ0eUxpbmVzKTtcblxuXHRcdFx0dGhpcy5wbHVnaW4uc2V0U3RhdHVzQmFyV29ya2luZygpO1xuXHRcdFx0dGhpcy5jaGVja0xpbmVzKGluc3RhbmNlKTtcblx0XHR9XG5cdH07XG5cblx0cHJpdmF0ZSByZWFkb25seSBydW5BdXRvRGV0ZWN0aW9uID0gYXN5bmMgKGluc3RhbmNlOiBDb2RlTWlycm9yLkVkaXRvcikgPT4ge1xuXHRcdGNvbnN0IGRpcnR5TGluZXMgPSB0aGlzLmRpcnR5TGluZXMuZ2V0KGluc3RhbmNlKTtcblxuXHRcdGlmICghZGlydHlMaW5lcyB8fCBkaXJ0eUxpbmVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIHRoaXMucGx1Z2luLnNldFN0YXR1c0JhclJlYWR5KCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5kaXJ0eUxpbmVzLmRlbGV0ZShpbnN0YW5jZSk7XG5cblx0XHRjb25zdCBsaW5lc1RvQ2hlY2sgPSBkaXJ0eUxpbmVzLnNvcnQoKGEsIGIpID0+IHtcblx0XHRcdHJldHVybiBhIC0gYjtcblx0XHR9KTtcblxuXHRcdGNvbnN0IGxhc3RMaW5lSW5kZXggPSBsaW5lc1RvQ2hlY2tbbGluZXNUb0NoZWNrLmxlbmd0aCAtIDFdO1xuXHRcdGNvbnN0IGxhc3RMaW5lID0gaW5zdGFuY2UuZ2V0TGluZShsYXN0TGluZUluZGV4KTtcblxuXHRcdGNvbnN0IHN0YXJ0OiBDb2RlTWlycm9yLlBvc2l0aW9uID0ge1xuXHRcdFx0bGluZTogbGluZXNUb0NoZWNrWzBdLFxuXHRcdFx0Y2g6IDAsXG5cdFx0fTtcblxuXHRcdGNvbnN0IGVuZDogQ29kZU1pcnJvci5Qb3NpdGlvbiA9IHtcblx0XHRcdGxpbmU6IGxpbmVzVG9DaGVja1tsaW5lc1RvQ2hlY2subGVuZ3RoIC0gMV0sXG5cdFx0XHRjaDogbGFzdExpbmUubGVuZ3RoLFxuXHRcdH07XG5cblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5ydW5EZXRlY3Rpb24oaW5zdGFuY2UsIHN0YXJ0LCBlbmQpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0XHR0aGlzLnBsdWdpbi5zZXRTdGF0dXNCYXJSZWFkeSgpO1xuXHRcdH1cblx0fTtcblxuXHRwdWJsaWMgYXN5bmMgcnVuRGV0ZWN0aW9uKFxuXHRcdGVkaXRvcjogQ29kZU1pcnJvci5FZGl0b3IsXG5cdFx0c2VsZWN0aW9uRnJvbT86IENvZGVNaXJyb3IuUG9zaXRpb24sXG5cdFx0c2VsZWN0aW9uVG8/OiBDb2RlTWlycm9yLlBvc2l0aW9uLFxuXHQpIHtcblx0XHR0aGlzLnBsdWdpbi5zZXRTdGF0dXNCYXJXb3JraW5nKCk7XG5cblx0XHRjb25zdCBkb2MgPSBlZGl0b3IuZ2V0RG9jKCk7XG5cdFx0Y29uc3QgdGV4dCA9IHNlbGVjdGlvbkZyb20gJiYgc2VsZWN0aW9uVG8gPyBlZGl0b3IuZ2V0UmFuZ2Uoc2VsZWN0aW9uRnJvbSwgc2VsZWN0aW9uVG8pIDogZWRpdG9yLmdldFZhbHVlKCk7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gc2VsZWN0aW9uRnJvbSAmJiBzZWxlY3Rpb25UbyA/IGRvYy5pbmRleEZyb21Qb3Moc2VsZWN0aW9uRnJvbSkgOiAwO1xuXG5cdFx0Y29uc3QgaGFzaCA9IGhhc2hTdHJpbmcodGV4dCk7XG5cblx0XHRpZiAodGhpcy5oYXNoTHJ1LmhhcyhoYXNoKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuaGFzaExydS5nZXQoaGFzaCkhO1xuXHRcdH1cblxuXHRcdGxldCByZXM6IExhbmd1YWdlVG9vbEFwaTtcblx0XHR0cnkge1xuXHRcdFx0cmVzID0gYXdhaXQgZ2V0RGV0ZWN0aW9uUmVzdWx0KHRleHQsICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzKTtcblx0XHRcdHRoaXMuaGFzaExydS5zZXQoaGFzaCwgcmVzKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLnBsdWdpbi5zZXRTdGF0dXNCYXJSZWFkeSgpO1xuXHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KGUpO1xuXHRcdH1cblxuXHRcdGlmIChzZWxlY3Rpb25Gcm9tICYmIHNlbGVjdGlvblRvKSB7XG5cdFx0XHRsZWdhY3lDbGVhck1hcmtzKHRoaXMubWFya2VyTWFwLCBlZGl0b3IsIHNlbGVjdGlvbkZyb20sIHNlbGVjdGlvblRvKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGVnYWN5Q2xlYXJNYXJrcyh0aGlzLm1hcmtlck1hcCwgZWRpdG9yKTtcblx0XHR9XG5cblx0XHRpZiAoIXJlcy5tYXRjaGVzKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5wbHVnaW4uc2V0U3RhdHVzQmFyUmVhZHkoKTtcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IG1hdGNoIG9mIHJlcy5tYXRjaGVzKSB7XG5cdFx0XHRjb25zdCBzdGFydCA9IGRvYy5wb3NGcm9tSW5kZXgobWF0Y2gub2Zmc2V0ICsgb2Zmc2V0KTtcblx0XHRcdGNvbnN0IG1hcmtlcnMgPSBlZGl0b3IuZmluZE1hcmtzQXQoc3RhcnQpO1xuXG5cdFx0XHRpZiAobWFya2VycyAmJiBtYXJrZXJzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGVuZCA9IGRvYy5wb3NGcm9tSW5kZXgobWF0Y2gub2Zmc2V0ICsgb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoKTtcblxuXHRcdFx0aWYgKFxuXHRcdFx0XHQhbGVnYWN5U2hvdWxkQ2hlY2tUZXh0QXRQb3MoZWRpdG9yLCBzdGFydCkgfHxcblx0XHRcdFx0IWxlZ2FjeVNob3VsZENoZWNrVGV4dEF0UG9zKGVkaXRvciwgZW5kKSB8fFxuXHRcdFx0XHQhdGhpcy5tYXRjaEFsbG93ZWQoZWRpdG9yLCBtYXRjaCwgc3RhcnQsIGVuZClcblx0XHRcdCkge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbWFya2VyID0gZWRpdG9yLm1hcmtUZXh0KHN0YXJ0LCBlbmQsIHtcblx0XHRcdFx0Y2xhc3NOYW1lOiBgbHQtdW5kZXJsaW5lICR7Z2V0SXNzdWVUeXBlQ2xhc3NOYW1lKG1hdGNoLnJ1bGUuY2F0ZWdvcnkuaWQpfWAsXG5cdFx0XHRcdGNsZWFyT25FbnRlcjogZmFsc2UsXG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5tYXJrZXJNYXAuc2V0KG1hcmtlciwgbWF0Y2gpO1xuXHRcdH1cblxuXHRcdHRoaXMucGx1Z2luLnNldFN0YXR1c0JhclJlYWR5KCk7XG5cdH1cblxuXHRwcml2YXRlIG1hdGNoQWxsb3dlZChcblx0XHRlZGl0b3I6IENvZGVNaXJyb3IuRWRpdG9yLFxuXHRcdG1hdGNoOiBNYXRjaGVzRW50aXR5LFxuXHRcdHN0YXJ0OiBDb2RlTWlycm9yLlBvc2l0aW9uLFxuXHRcdGVuZDogQ29kZU1pcnJvci5Qb3NpdGlvbixcblx0KSB7XG5cdFx0Y29uc3Qgc3RyID0gZWRpdG9yLmdldFJhbmdlKHN0YXJ0LCBlbmQpO1xuXG5cdFx0Ly8gRG9uJ3Qgc2hvdyBzcGVsbGluZyBlcnJvcnMgZm9yIGVudHJpZXMgaW4gdGhlIHVzZXIgZGljdGlvbmFyeVxuXHRcdGlmIChtYXRjaC5ydWxlLmNhdGVnb3J5LmlkID09PSAnVFlQT1MnKSB7XG5cdFx0XHRjb25zdCBzcGVsbGNoZWNrRGljdGlvbmFyeTogc3RyaW5nW10gPSAodGhpcy5hcHAudmF1bHQgYXMgYW55KS5nZXRDb25maWcoJ3NwZWxsY2hlY2tEaWN0aW9uYXJ5Jyk7XG5cblx0XHRcdGlmIChzcGVsbGNoZWNrRGljdGlvbmFyeSAmJiBzcGVsbGNoZWNrRGljdGlvbmFyeS5pbmNsdWRlcyhzdHIpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBsaW5lVG9rZW5zID0gZWRpdG9yLmdldExpbmVUb2tlbnMoc3RhcnQubGluZSk7XG5cblx0XHQvLyBEb24ndCBzaG93IHdoaXRlc3BhY2Ugd2FybmluZ3MgaW4gdGFibGVzXG5cdFx0aWYgKGxpbmVUb2tlbnMubGVuZ3RoICYmIGxpbmVUb2tlbnNbMF0udHlwZT8uaW5jbHVkZXMoJ3RhYmxlJykpIHtcblx0XHRcdGlmIChtYXRjaC5ydWxlLmlkID09PSAnV0hJVEVTUEFDRV9SVUxFJykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn1cbiIsImltcG9ydCB7IE1hcmtkb3duVmlldywgTWVudSwgTm90aWNlLCBQbHVnaW4sIHNldEljb24gfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBFZGl0b3JWaWV3IH0gZnJvbSAnQGNvZGVtaXJyb3Ivdmlldyc7XG5pbXBvcnQgeyBTdGF0ZUVmZmVjdCB9IGZyb20gJ0Bjb2RlbWlycm9yL3N0YXRlJztcbmltcG9ydCBRdWlja0xSVSBmcm9tICdxdWljay1scnUnO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgTGFuZ3VhZ2VUb29sUGx1Z2luU2V0dGluZ3MsIExhbmd1YWdlVG9vbFNldHRpbmdzVGFiIH0gZnJvbSAnLi9TZXR0aW5nc1RhYic7XG5pbXBvcnQgeyBMYW5ndWFnZVRvb2xBcGkgfSBmcm9tICcuL0xhbmd1YWdlVG9vbFR5cGluZ3MnO1xuaW1wb3J0IHsgaGFzaFN0cmluZyB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBnZXREZXRlY3Rpb25SZXN1bHQgfSBmcm9tICcuL2FwaSc7XG5pbXBvcnQgeyBidWlsZFVuZGVybGluZUV4dGVuc2lvbiB9IGZyb20gJy4vY202L3VuZGVybGluZUV4dGVuc2lvbic7XG5pbXBvcnQgeyBhZGRVbmRlcmxpbmUsIGNsZWFyVW5kZXJsaW5lcywgY2xlYXJVbmRlcmxpbmVzSW5SYW5nZSB9IGZyb20gJy4vY202L3VuZGVybGluZVN0YXRlRmllbGQnO1xuaW1wb3J0IExlZ2FjeUxhbmd1YWdlVG9vbFBsdWdpbiBmcm9tICcuL2NtNS9MZWdhY3lQbHVnaW4nO1xuaW1wb3J0IHsgbGVnYWN5Q2xlYXJNYXJrcyB9IGZyb20gJy4vY201L2hlbHBlcnMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMYW5ndWFnZVRvb2xQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRwdWJsaWMgc2V0dGluZ3M6IExhbmd1YWdlVG9vbFBsdWdpblNldHRpbmdzO1xuXHRwcml2YXRlIHN0YXR1c0JhclRleHQ6IEhUTUxFbGVtZW50O1xuXG5cdHByaXZhdGUgaGFzaExydTogUXVpY2tMUlU8bnVtYmVyLCBMYW5ndWFnZVRvb2xBcGk+O1xuXHRwcml2YXRlIGlzbG9hZGluZyA9IGZhbHNlO1xuXG5cdC8vIExlZ2FjeSBlZGl0b3Jcblx0cHJpdmF0ZSBpc0xlZ2FjeUVkaXRvcjogYm9vbGVhbjtcblx0cHJpdmF0ZSBsZWdhY3lQbHVnaW46IExlZ2FjeUxhbmd1YWdlVG9vbFBsdWdpbjtcblxuXHRwdWJsaWMgYXN5bmMgb25sb2FkKCkge1xuXHRcdHRoaXMuaXNMZWdhY3lFZGl0b3IgPSBCb29sZWFuKCh0aGlzLmFwcC52YXVsdCBhcyBhbnkpLmdldENvbmZpZygnbGVnYWN5RWRpdG9yJykpO1xuXG5cdFx0Ly8gU2V0dGluZ3Ncblx0XHRhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG5cdFx0aWYgKHRoaXMuc2V0dGluZ3Muc2VydmVyVXJsLmluY2x1ZGVzKCcvdjIvY2hlY2snKSkge1xuXHRcdFx0bmV3IE5vdGljZShcblx0XHRcdFx0XCJpbnZhbGlkIG9yIG91dGRhdGVkIExhbmd1YWdlVG9vbCBTZXR0aW5ncywgSSdtIHRyeWluZyB0byBmaXggaXQuXFxuSWYgaXQgZG9lcyBub3Qgd29yaywgc2ltcGx5IHJlaW5zdGFsbCB0aGUgcGx1Z2luXCIsXG5cdFx0XHRcdDEwMDAwLFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuc2V0dGluZ3Muc2VydmVyVXJsID0gdGhpcy5zZXR0aW5ncy5zZXJ2ZXJVcmwucmVwbGFjZSgnL3YyL2NoZWNrJywgJycpO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmFkZFNldHRpbmdUYWIobmV3IExhbmd1YWdlVG9vbFNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cblx0XHQvLyBTdGF0dXMgYmFyXG5cdFx0dGhpcy5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHkoKCkgPT4ge1xuXHRcdFx0dGhpcy5zdGF0dXNCYXJUZXh0ID0gdGhpcy5hZGRTdGF0dXNCYXJJdGVtKCk7XG5cdFx0XHR0aGlzLnNldFN0YXR1c0JhclJlYWR5KCk7XG5cdFx0XHR0aGlzLnJlZ2lzdGVyRG9tRXZlbnQodGhpcy5zdGF0dXNCYXJUZXh0LCAnY2xpY2snLCB0aGlzLmhhbmRsZVN0YXR1c0JhckNsaWNrKTtcblx0XHR9KTtcblxuXHRcdC8vIEVkaXRvciBmdW5jdGlvbmFsaXR5XG5cdFx0aWYgKHRoaXMuaXNMZWdhY3lFZGl0b3IpIHtcblx0XHRcdHRoaXMubGVnYWN5UGx1Z2luID0gbmV3IExlZ2FjeUxhbmd1YWdlVG9vbFBsdWdpbih0aGlzKTtcblx0XHRcdGF3YWl0IHRoaXMubGVnYWN5UGx1Z2luLm9ubG9hZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmhhc2hMcnUgPSBuZXcgUXVpY2tMUlU8bnVtYmVyLCBMYW5ndWFnZVRvb2xBcGk+KHtcblx0XHRcdFx0bWF4U2l6ZTogMTAsXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMucmVnaXN0ZXJFZGl0b3JFeHRlbnNpb24oYnVpbGRVbmRlcmxpbmVFeHRlbnNpb24odGhpcykpO1xuXHRcdH1cblxuXHRcdC8vIENvbW1hbmRzXG5cdFx0dGhpcy5yZWdpc3RlckNvbW1hbmRzKCk7XG5cdH1cblxuXHRwdWJsaWMgb251bmxvYWQoKSB7XG5cdFx0aWYgKHRoaXMuaXNMZWdhY3lFZGl0b3IpIHtcblx0XHRcdHRoaXMubGVnYWN5UGx1Z2luLm9udW5sb2FkKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5oYXNoTHJ1LmNsZWFyKCk7XG5cdH1cblxuXHRwcml2YXRlIHJlZ2lzdGVyQ29tbWFuZHMoKSB7XG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnbHRjaGVjay10ZXh0Jyxcblx0XHRcdG5hbWU6ICdDaGVjayBUZXh0Jyxcblx0XHRcdGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yLCB2aWV3KSA9PiB7XG5cdFx0XHRcdGlmICh0aGlzLmlzTGVnYWN5RWRpdG9yKSB7XG5cdFx0XHRcdFx0Y29uc3QgY20gPSAoZWRpdG9yIGFzIGFueSkuY20gYXMgQ29kZU1pcnJvci5FZGl0b3I7XG5cblx0XHRcdFx0XHRpZiAoZWRpdG9yLnNvbWV0aGluZ1NlbGVjdGVkKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMubGVnYWN5UGx1Z2luLnJ1bkRldGVjdGlvbihjbSwgY20uZ2V0Q3Vyc29yKCdmcm9tJyksIGNtLmdldEN1cnNvcigndG8nKSkuY2F0Y2goZSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5sZWdhY3lQbHVnaW4ucnVuRGV0ZWN0aW9uKGNtKS5jYXRjaChlID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnJ1bkRldGVjdGlvbigoZWRpdG9yIGFzIGFueSkuY20gYXMgRWRpdG9yVmlldywgdmlldykuY2F0Y2goZSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnbHRhdXRvY2hlY2stdGV4dCcsXG5cdFx0XHRuYW1lOiAnVG9nZ2xlIEF1dG9tYXRpYyBDaGVja2luZycsXG5cdFx0XHRjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNldHRpbmdzLnNob3VsZEF1dG9DaGVjayA9ICF0aGlzLnNldHRpbmdzLnNob3VsZEF1dG9DaGVjaztcblx0XHRcdFx0YXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdsdGNsZWFyJyxcblx0XHRcdG5hbWU6ICdDbGVhciBTdWdnZXN0aW9ucycsXG5cdFx0XHRlZGl0b3JDYWxsYmFjazogZWRpdG9yID0+IHtcblx0XHRcdFx0aWYgKHRoaXMuaXNMZWdhY3lFZGl0b3IpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5sZWdhY3lQbHVnaW4ubWFya2VyTWFwLnNpemUgPiAwKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBjbSA9IChlZGl0b3IgYXMgYW55KS5jbSBhcyBDb2RlTWlycm9yLkVkaXRvcjtcblx0XHRcdFx0XHRcdGxlZ2FjeUNsZWFyTWFya3ModGhpcy5sZWdhY3lQbHVnaW4ubWFya2VyTWFwLCBjbSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnN0IGNtID0gKGVkaXRvciBhcyBhbnkpLmNtIGFzIEVkaXRvclZpZXc7XG5cdFx0XHRcdFx0Y20uZGlzcGF0Y2goe1xuXHRcdFx0XHRcdFx0ZWZmZWN0czogW2NsZWFyVW5kZXJsaW5lcy5vZihudWxsKV0sXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgc2V0U3RhdHVzQmFyUmVhZHkoKSB7XG5cdFx0dGhpcy5pc2xvYWRpbmcgPSBmYWxzZTtcblx0XHR0aGlzLnN0YXR1c0JhclRleHQuZW1wdHkoKTtcblx0XHR0aGlzLnN0YXR1c0JhclRleHQuY3JlYXRlU3Bhbih7IGNsczogJ2x0LXN0YXR1cy1iYXItYnRuJyB9LCBzcGFuID0+IHtcblx0XHRcdHNwYW4uY3JlYXRlU3Bhbih7IGNsczogJ2x0LXN0YXR1cy1iYXItY2hlY2staWNvbicsIHRleHQ6ICdBYScgfSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgc2V0U3RhdHVzQmFyV29ya2luZygpIHtcblx0XHRpZiAodGhpcy5pc2xvYWRpbmcpIHJldHVybjtcblxuXHRcdHRoaXMuaXNsb2FkaW5nID0gdHJ1ZTtcblx0XHR0aGlzLnN0YXR1c0JhclRleHQuZW1wdHkoKTtcblx0XHR0aGlzLnN0YXR1c0JhclRleHQuY3JlYXRlU3Bhbih7IGNsczogWydsdC1zdGF0dXMtYmFyLWJ0bicsICdsdC1sb2FkaW5nJ10gfSwgc3BhbiA9PiB7XG5cdFx0XHRzZXRJY29uKHNwYW4sICdzeW5jLXNtYWxsJyk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IGhhbmRsZVN0YXR1c0JhckNsaWNrID0gKCkgPT4ge1xuXHRcdGNvbnN0IHN0YXR1c0JhclJlY3QgPSB0aGlzLnN0YXR1c0JhclRleHQucGFyZW50RWxlbWVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0Y29uc3Qgc3RhdHVzQmFySWNvblJlY3QgPSB0aGlzLnN0YXR1c0JhclRleHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHRuZXcgTWVudSh0aGlzLmFwcClcblx0XHRcdC5hZGRJdGVtKGl0ZW0gPT4ge1xuXHRcdFx0XHRpdGVtLnNldFRpdGxlKCdDaGVjayBjdXJyZW50IGRvY3VtZW50Jyk7XG5cdFx0XHRcdGl0ZW0uc2V0SWNvbignY2hlY2tib3gtZ2x5cGgnKTtcblx0XHRcdFx0aXRlbS5vbkNsaWNrKGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBhY3RpdmVMZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWY7XG5cdFx0XHRcdFx0aWYgKGFjdGl2ZUxlYWY/LnZpZXcgaW5zdGFuY2VvZiBNYXJrZG93blZpZXcgJiYgYWN0aXZlTGVhZi52aWV3LmdldE1vZGUoKSA9PT0gJ3NvdXJjZScpIHtcblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmlzTGVnYWN5RWRpdG9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5sZWdhY3lQbHVnaW4ucnVuRGV0ZWN0aW9uKChhY3RpdmVMZWFmLnZpZXcuZWRpdG9yIGFzIGFueSkuY20pO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucnVuRGV0ZWN0aW9uKChhY3RpdmVMZWFmLnZpZXcuZWRpdG9yIGFzIGFueSkuY20sIGFjdGl2ZUxlYWYudmlldyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5hZGRJdGVtKGl0ZW0gPT4ge1xuXHRcdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMuc2V0dGluZ3Muc2hvdWxkQXV0b0NoZWNrID8gJ0Rpc2FibGUgYXV0b21hdGljIGNoZWNraW5nJyA6ICdFbmFibGUgYXV0b21hdGljIGNoZWNraW5nJyk7XG5cdFx0XHRcdGl0ZW0uc2V0SWNvbigndXBwZXJjYXNlLWxvd2VyY2FzZS1hJyk7XG5cdFx0XHRcdGl0ZW0ub25DbGljayhhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5zaG91bGRBdXRvQ2hlY2sgPSAhdGhpcy5zZXR0aW5ncy5zaG91bGRBdXRvQ2hlY2s7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LmFkZEl0ZW0oaXRlbSA9PiB7XG5cdFx0XHRcdGl0ZW0uc2V0VGl0bGUoJ0NsZWFyIHN1Z2dlc3Rpb25zJyk7XG5cdFx0XHRcdGl0ZW0uc2V0SWNvbigncmVzZXQnKTtcblx0XHRcdFx0aXRlbS5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcblx0XHRcdFx0XHRpZiAoIXZpZXcpIHJldHVybjtcblxuXHRcdFx0XHRcdGlmICh0aGlzLmlzTGVnYWN5RWRpdG9yKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBjbSA9ICh2aWV3LmVkaXRvciBhcyBhbnkpLmNtIGFzIENvZGVNaXJyb3IuRWRpdG9yO1xuXHRcdFx0XHRcdFx0bGVnYWN5Q2xlYXJNYXJrcyh0aGlzLmxlZ2FjeVBsdWdpbi5tYXJrZXJNYXAsIGNtKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc3QgY20gPSAodmlldy5lZGl0b3IgYXMgYW55KS5jbSBhcyBFZGl0b3JWaWV3O1xuXHRcdFx0XHRcdFx0Y20uZGlzcGF0Y2goe1xuXHRcdFx0XHRcdFx0XHRlZmZlY3RzOiBbY2xlYXJVbmRlcmxpbmVzLm9mKG51bGwpXSxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LnNob3dBdFBvc2l0aW9uKHtcblx0XHRcdFx0eDogc3RhdHVzQmFySWNvblJlY3QucmlnaHQgKyA1LFxuXHRcdFx0XHR5OiAoc3RhdHVzQmFyUmVjdD8udG9wIHx8IDApIC0gNSxcblx0XHRcdH0pO1xuXHR9O1xuXG5cdHB1YmxpYyBhc3luYyBydW5EZXRlY3Rpb24oZWRpdG9yOiBFZGl0b3JWaWV3LCB2aWV3OiBNYXJrZG93blZpZXcsIGZyb20/OiBudW1iZXIsIHRvPzogbnVtYmVyKSB7XG5cdFx0dGhpcy5zZXRTdGF0dXNCYXJXb3JraW5nKCk7XG5cblx0XHRjb25zdCBzZWxlY3Rpb24gPSBlZGl0b3Iuc3RhdGUuc2VsZWN0aW9uLm1haW47XG5cblx0XHRsZXQgdGV4dCA9IHZpZXcuZGF0YTtcblx0XHRsZXQgb2Zmc2V0ID0gMDtcblx0XHRsZXQgaXNSYW5nZSA9IGZhbHNlO1xuXHRcdGxldCByYW5nZUZyb20gPSAwO1xuXHRcdGxldCByYW5nZVRvID0gMDtcblxuXHRcdGlmIChmcm9tID09PSB1bmRlZmluZWQgJiYgc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5mcm9tICE9PSBzZWxlY3Rpb24udG8pIHtcblx0XHRcdGZyb20gPSBzZWxlY3Rpb24uZnJvbTtcblx0XHRcdHRvID0gc2VsZWN0aW9uLnRvO1xuXHRcdH1cblxuXHRcdGlmIChmcm9tICE9PSB1bmRlZmluZWQgJiYgdG8gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGV4dCA9IGVkaXRvci5zdGF0ZS5zbGljZURvYyhmcm9tLCB0byk7XG5cdFx0XHRvZmZzZXQgPSBmcm9tO1xuXHRcdFx0cmFuZ2VGcm9tID0gZnJvbTtcblx0XHRcdHJhbmdlVG8gPSB0bztcblx0XHRcdGlzUmFuZ2UgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhhc2ggPSBoYXNoU3RyaW5nKHRleHQpO1xuXG5cdFx0aWYgKHRoaXMuaGFzaExydS5oYXMoaGFzaCkpIHtcblx0XHRcdHJldHVybiB0aGlzLmhhc2hMcnUuZ2V0KGhhc2gpITtcblx0XHR9XG5cblx0XHRsZXQgcmVzOiBMYW5ndWFnZVRvb2xBcGk7XG5cdFx0dHJ5IHtcblx0XHRcdHJlcyA9IGF3YWl0IGdldERldGVjdGlvblJlc3VsdCh0ZXh0LCAoKSA9PiB0aGlzLnNldHRpbmdzKTtcblx0XHRcdHRoaXMuaGFzaExydS5zZXQoaGFzaCwgcmVzKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLnNldFN0YXR1c0JhclJlYWR5KCk7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZWZmZWN0czogU3RhdGVFZmZlY3Q8YW55PltdID0gW107XG5cblx0XHRpZiAoaXNSYW5nZSkge1xuXHRcdFx0ZWZmZWN0cy5wdXNoKFxuXHRcdFx0XHRjbGVhclVuZGVybGluZXNJblJhbmdlLm9mKHtcblx0XHRcdFx0XHRmcm9tOiByYW5nZUZyb20sXG5cdFx0XHRcdFx0dG86IHJhbmdlVG8sXG5cdFx0XHRcdH0pLFxuXHRcdFx0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZWZmZWN0cy5wdXNoKGNsZWFyVW5kZXJsaW5lcy5vZihudWxsKSk7XG5cdFx0fVxuXG5cdFx0aWYgKHJlcy5tYXRjaGVzKSB7XG5cdFx0XHRmb3IgKGNvbnN0IG1hdGNoIG9mIHJlcy5tYXRjaGVzKSB7XG5cdFx0XHRcdGNvbnN0IHN0YXJ0ID0gbWF0Y2gub2Zmc2V0ICsgb2Zmc2V0O1xuXHRcdFx0XHRjb25zdCBlbmQgPSBtYXRjaC5vZmZzZXQgKyBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cblx0XHRcdFx0ZWZmZWN0cy5wdXNoKFxuXHRcdFx0XHRcdGFkZFVuZGVybGluZS5vZih7XG5cdFx0XHRcdFx0XHRmcm9tOiBzdGFydCxcblx0XHRcdFx0XHRcdHRvOiBlbmQsXG5cdFx0XHRcdFx0XHRtYXRjaCxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZWZmZWN0cy5sZW5ndGgpIHtcblx0XHRcdGVkaXRvci5kaXNwYXRjaCh7XG5cdFx0XHRcdGVmZmVjdHMsXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHR0aGlzLnNldFN0YXR1c0JhclJlYWR5KCk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuXHRcdHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcblx0XHRhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyB0b29sdGlwcyB9IGZyb20gJ0Bjb2RlbWlycm9yL3Rvb2x0aXAnO1xuaW1wb3J0IExhbmd1YWdlVG9vbFBsdWdpbiBmcm9tICdzcmMnO1xuaW1wb3J0IHsgYnVpbGRBdXRvQ2hlY2tIYW5kbGVyIH0gZnJvbSAnLi9idWlsZEF1dG9DaGVja0hhbmRsZXInO1xuaW1wb3J0IHsgYnVpbGRUb29sdGlwRmllbGQgfSBmcm9tICcuL3Rvb2x0aXBGaWVsZCc7XG5pbXBvcnQgeyB1bmRlcmxpbmVGaWVsZCB9IGZyb20gJy4vdW5kZXJsaW5lU3RhdGVGaWVsZCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFVuZGVybGluZUV4dGVuc2lvbihwbHVnaW46IExhbmd1YWdlVG9vbFBsdWdpbikge1xuXHRyZXR1cm4gW1xuXHRcdHRvb2x0aXBzKHtcblx0XHRcdHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuXHRcdFx0dG9vbHRpcFNwYWNlOiB2aWV3ID0+IHtcblx0XHRcdFx0Y29uc3QgcmVjdCA9IHZpZXcuZG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0dG9wOiByZWN0LnRvcCxcblx0XHRcdFx0XHRsZWZ0OiByZWN0LmxlZnQsXG5cdFx0XHRcdFx0Ym90dG9tOiByZWN0LmJvdHRvbSxcblx0XHRcdFx0XHRyaWdodDogcmVjdC5yaWdodCxcblx0XHRcdFx0fTtcblx0XHRcdH0sXG5cdFx0fSksXG5cdFx0dW5kZXJsaW5lRmllbGQsXG5cdFx0YnVpbGRUb29sdGlwRmllbGQocGx1Z2luKSxcblx0XHRidWlsZEF1dG9DaGVja0hhbmRsZXIocGx1Z2luKSxcblx0XTtcbn1cbiJdLCJuYW1lcyI6WyJfX2F3YWl0ZXIiLCJ0aGlzQXJnIiwiX2FyZ3VtZW50cyIsIlAiLCJnZW5lcmF0b3IiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImZ1bGZpbGxlZCIsInZhbHVlIiwic3RlcCIsIm5leHQiLCJlIiwicmVqZWN0ZWQiLCJyZXN1bHQiLCJkb25lIiwiYWRvcHQiLCJ0aGVuIiwiYXBwbHkiLCJRdWlja0xSVSIsIltvYmplY3QgT2JqZWN0XSIsIm9wdGlvbnMiLCJtYXhTaXplIiwiVHlwZUVycm9yIiwibWF4QWdlIiwidGhpcyIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwib25FdmljdGlvbiIsImNhY2hlIiwiTWFwIiwib2xkQ2FjaGUiLCJfc2l6ZSIsImtleSIsIml0ZW0iLCJleHBpcnkiLCJEYXRlIiwibm93IiwiZGVsZXRlIiwiX2RlbGV0ZUlmRXhwaXJlZCIsIl9nZXRPckRlbGV0ZUlmRXhwaXJlZCIsImdldCIsIl9nZXRJdGVtVmFsdWUiLCJzZXQiLCJfZW1pdEV2aWN0aW9ucyIsIl9zZXQiLCJoYXMiLCJfbW92ZVRvUmVjZW50IiwidW5kZWZpbmVkIiwiX3BlZWsiLCJkZWxldGVkIiwiY2xlYXIiLCJuZXdTaXplIiwiaXRlbXMiLCJfZW50cmllc0FzY2VuZGluZyIsInJlbW92ZUNvdW50IiwibGVuZ3RoIiwic2xpY2UiLCJTeW1ib2wiLCJpdGVyYXRvciIsImkiLCJzaXplIiwib2xkQ2FjaGVTaXplIiwia2V5cyIsIk1hdGgiLCJtaW4iLCJERUZBVUxUX1NFVFRJTkdTIiwic2VydmVyVXJsIiwiZ2xhc3NCZyIsInNob3VsZEF1dG9DaGVjayIsInBpY2t5TW9kZSIsIkxhbmd1YWdlVG9vbFNldHRpbmdzVGFiIiwiUGx1Z2luU2V0dGluZ1RhYiIsImFwcCIsInBsdWdpbiIsInN1cGVyIiwibGFuZ3VhZ2VzIiwiZmV0Y2giLCJzZXR0aW5ncyIsInJlcyIsImpzb24iLCJjb250YWluZXJFbCIsImVtcHR5IiwiY3JlYXRlRWwiLCJ0ZXh0IiwiU2V0dGluZyIsInNldE5hbWUiLCJzZXREZXNjIiwic2V0dGluZyIsImlucHV0IiwiYWRkVGV4dCIsInNldFBsYWNlaG9sZGVyIiwic2V0VmFsdWUiLCJvbkNoYW5nZSIsInJlcGxhY2UiLCJzYXZlU2V0dGluZ3MiLCJhZGRFeHRyYUJ1dHRvbiIsImJ1dHRvbiIsInNldEljb24iLCJzZXRUb29sdGlwIiwib25DbGljayIsImFkZFRvZ2dsZSIsImNvbXBvbmVudCIsImFkZERyb3Bkb3duIiwicmVxdWVzdExhbmd1YWdlcyIsImFkZE9wdGlvbiIsImZvckVhY2giLCJ2IiwibG9uZ0NvZGUiLCJuYW1lIiwic3RhdGljTGFuZ3VhZ2UiLCJjYXRjaCIsImNvbnNvbGUiLCJlcnJvciIsInJ1bGVPdGhlckNhdGVnb3JpZXMiLCJkZXNjRWwiLCJocmVmIiwiYSIsInNldEF0dHIiLCJydWxlT3RoZXJSdWxlcyIsInJ1bGVPdGhlckRpc2FibGVkUnVsZXMiLCJ1c2VybmFtZSIsImFwaWtleSIsImlnbm9yZUxpc3RSZWdFeCIsImhhc2hTdHJpbmciLCJoYXNoIiwiY2hhckNvZGVBdCIsImdldElzc3VlVHlwZUNsYXNzTmFtZSIsImNhdGVnb3J5SWQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImV4cG9ydHMiLCJkZWZhdWx0cyIsImNoaWxkcmVuIiwibm9kZSIsImFubm90YXRldGV4dG5vZGUiLCJ0eXBlIiwib2Zmc2V0IiwiZW5kIiwicG9zaXRpb24iLCJzdGFydCIsInN1YnN0cmluZyIsImludGVycHJldG1hcmt1cCIsImNvbGxlY3R0ZXh0bm9kZXMiLCJhc3QiLCJ0ZXh0YW5ub3RhdGlvbnMiLCJyZWN1cnNlIiwiYW5ub3RhdGlvbiIsInB1c2giLCJBcnJheSIsImlzQXJyYXkiLCJjb21wb3NlYW5ub3RhdGlvbiIsImFubm90YXRlZHRleHRub2RlcyIsImFubm90YXRpb25zIiwicHJpb3IiLCJjdXJyZW50IiwiY3VycmVudHRleHQiLCJpbnRlcnByZXRBcyIsIm1hcmt1cCIsImZpbmFsdGV4dCIsInBhcnNlIiwibmFtZXNwYWNlIiwiZm9ybWF0IiwiZm10IiwiYyIsImFyZyIsInRtcCIsInByZWNpc2lvbiIsImFyZ0luZGV4IiwiYXJncyIsImNhbGwiLCJhcmd1bWVudHMiLCJuIiwiZXNjYXBlZCIsImxlYWRpbmdaZXJvIiwibmV4dEFyZyIsInNsdXJwTnVtYmVyIiwiZGlnaXRzIiwidGVzdCIsInBhcnNlSW50IiwidG9TdHJpbmciLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJwYXJzZUZsb2F0IiwidG9GaXhlZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0b1VwcGVyQ2FzZSIsIm1vZHVsZSIsInZzcHJpbnRmIiwicmVwbGFjZW1lbnRzIiwiY29uY2F0IiwibG9nIiwicHJpbnRmIiwiZmF1bHQiLCJjcmVhdGUiLCJFcnJvciIsIkVDb25zdHJ1Y3RvciIsIkZvcm1hdHRlZEVycm9yIiwiZGlzcGxheU5hbWUiLCJmb3JtYXR0ZXIiLCJldmFsIiwiRXZhbEVycm9yIiwicmFuZ2UiLCJSYW5nZUVycm9yIiwicmVmZXJlbmNlIiwiUmVmZXJlbmNlRXJyb3IiLCJzeW50YXgiLCJTeW50YXhFcnJvciIsInVyaSIsIlVSSUVycm9yIiwicmVzdWx0cyIsImluZGV4IiwibWF0dGVyIiwib3duIiwiaGFzT3duUHJvcGVydHkiLCJtYXJrZXJzIiwieWFtbCIsInRvbWwiLCJvcHRpb24iLCJtYXJrZXIiLCJidWZmZXIiLCJhbnl3aGVyZSIsInZhbHVlVHlwZSIsImZlbmNlVHlwZSIsInNlcXVlbmNlVHlwZSIsImZlbmNlQ29uc3RydWN0IiwidG9rZW5pemUiLCJlZmZlY3RzIiwib2siLCJub2siLCJidWZmZXJJbmRleCIsImNvZGUiLCJlbnRlciIsImluc2lkZVNlcXVlbmNlIiwiZXhpdCIsImluc2lkZVdoaXRlc3BhY2UiLCJmZW5jZUVuZCIsImNvbnN1bWUiLCJwYXJ0aWFsIiwic2VsZiIsImNvbHVtbiIsImxpbmUiLCJmZW5jZSIsImF0dGVtcHQiLCJhZnRlck9wZW5pbmdGZW5jZSIsImxpbmVFbmQiLCJsaW5lU3RhcnQiLCJsaW5lRGF0YSIsImFmdGVyIiwiY29uY3JldGUiLCJwcm9wIiwicGljayIsInNjaGVtYSIsIm1hdHRlcnMiLCJmbG93Iiwib3BlbmVyIiwiY2xvc2UiLCJ0b2tlbiIsImRhdGEiLCJyZXN1bWUiLCJjb25maWciLCJ1bnNhZmUiLCJoYW5kbGVycyIsImhhbmRsZXIiLCJhdEJyZWFrIiwiY2hhcmFjdGVyIiwiY2hhckF0Iiwib3BlbiIsImFkZCIsImZpZWxkIiwiZnJvbU1hcmtkb3duIiwidG9NYXJrZG93biIsImFsdCIsInRpdGxlIiwiYWxsIiwidmFsdWVzIiwiam9pbiIsImFzc2lnbiIsInRvTG93ZXJDYXNlIiwiYmFzZSIsIm1heCIsImxpbWl0IiwiSW5maW5pdHkiLCJtYXJrZG93blNwYWNlIiwicHJlZml4IiwicHJldmlvdXMiLCJjb250ZW50U3RhcnQiLCJwYXJzZXIiLCJjb25zdHJ1Y3RzIiwiY29udGVudEluaXRpYWwiLCJmYWN0b3J5U3BhY2UiLCJjb250ZW50VHlwZSIsIm1hcmtkb3duTGluZUVuZGluZyIsImluc3BlY3RSZXN1bHQiLCJjaGlsZEZsb3ciLCJjaGlsZFRva2VuIiwic3RhY2siLCJjb250aW51ZWQiLCJpbnNwZWN0Q29uc3RydWN0Iiwic3ViY29udGludWVkIiwiaW5zcGVjdFN0YXJ0IiwiY29udGFpbmVyU3RhdGUiLCJjb250aW51YXRpb24iLCJpbnNwZWN0Q29udGludWUiLCJpbnNwZWN0TGVzcyIsImN1cnJlbnRDb25zdHJ1Y3QiLCJmbG93Q29udGludWUiLCJpbnNwZWN0RG9uZSIsImludGVycnVwdCIsImludGVycnVwdGlibGUiLCJjb250YWluZXJDb25zdHJ1Y3QiLCJpbnNwZWN0Rmxvd0VuZCIsIl9jbG9zZUZsb3ciLCJsYXp5IiwibGF6eUZsb3dDb25zdHJ1Y3QiLCJjaGVjayIsInBhcnRpYWxCbGFua0xpbmUiLCJpbnNwZWN0TGF6eSIsImZsb3dFbmQiLCJkb2N1bWVudENvbnRpbnVlIiwiZG9jdW1lbnRDb250aW51ZWQiLCJmbG93U3RhcnQiLCJjb250YWluZXJDb250aW51ZSIsImV4aXRDb250YWluZXJzIiwiX3Rva2VuaXplciIsImNvbnRpbnVlRmxvdyIsImRvY3VtZW50QWZ0ZXJQZWVrIiwiZGVmaW5lU2tpcCIsIndyaXRlIiwic2xpY2VTdHJlYW0iLCJkb2N1bWVudCIsImRpc2FibGUiLCJudWxsIiwiaW5kZXhPZiIsImNodW5rcyIsImV2ZW50cyIsInRhaWwiLCJzaXplQ2h1bmtzIiwic3BsaWNlIiwibGlzdCIsInJlbW92ZSIsInBhcmFtZXRlcnMiLCJjaHVua1N0YXJ0IiwiZnJvbSIsInVuc2hpZnQiLCJvYmplY3QiLCJzdWJjb250ZW50IiwiZXZlbnRJbmRleCIsInN0cmVhbSIsImVudGVyZWQiLCJhZGp1c3QiLCJjb250ZXh0Iiwic3RhcnRQb3NpdGlvbiIsInN0YXJ0UG9zaXRpb25zIiwidG9rZW5pemVyIiwiY2hpbGRFdmVudHMiLCJqdW1wcyIsImdhcHMiLCJpc0luRmlyc3RDb250ZW50T2ZMaXN0SXRlbSIsIl9nZm1UYXNrbGlzdEZpcnN0Q29udGVudE9mTGlzdEl0ZW0iLCJwb3AiLCJjaHVua2VkU3BsaWNlIiwiZXZlbnQiLCJsaW5lSW5kZXgiLCJvdGhlckluZGV4Iiwib3RoZXJFdmVudCIsInN1YmV2ZW50cyIsIm1vcmUiLCJfY29udGFpbmVyIiwiX21vdmVQcmV2aW91c0xpbmVFbmRpbmdzIiwic2hhbGxvdyIsImNvbnRlbnQiLCJjb250ZW50RW5kIiwiY29udGludWF0aW9uQ29uc3RydWN0IiwiY29udGVudENvbnRpbnVlIiwic3VidG9rZW5pemUiLCJwcmVmaXhlZCIsInByZWZpeFNpemUiLCJpbml0aWFsIiwiZmxvd0luaXRpYWwiLCJhZnRlckNvbnN0cnVjdCIsImluaXRpYWxpemVGYWN0b3J5Iiwic3RyaW5nIiwibm90VGV4dCIsInJlc29sdmVBbGwiLCJjcmVhdGVSZXNvbHZlciIsInJlc29sdmVBbGxMaW5lU3VmZml4ZXMiLCJleHRyYVJlc29sdmVyIiwiY2h1bmsiLCJ0YWJzIiwiX2luZGV4IiwiX2J1ZmZlckluZGV4IiwiZXh0ZW5zaW9uIiwiaG9vayIsImxlZnQiLCJyaWdodCIsIm1pbmlmbGF0IiwiZXhpc3RpbmciLCJiZWZvcmUiLCJleHRlbnNpb25zIiwiY2FsbGVkIiwiYXRUYWIiLCJ2aWV3Iiwic3RhcnRJbmRleCIsInN0YXJ0QnVmZmVySW5kZXgiLCJlbmRJbmRleCIsImVuZEJ1ZmZlckluZGV4IiwiaW5pdGlhbGl6ZSIsInBvaW50IiwiY29sdW1uU3RhcnQiLCJyZXNvbHZlQWxsQ29uc3RydWN0cyIsImFjY291bnRGb3JQb3RlbnRpYWxTa2lwIiwiZmllbGRzIiwiY29uc3RydWN0RmFjdG9yeSIsImNvbnN0cnVjdCIsImluZm8iLCJhZGRSZXN1bHQiLCJvbnN1Y2Nlc3NmdWxjaGVjayIsInNsaWNlU2VyaWFsaXplIiwic2VyaWFsaXplQ2h1bmtzIiwiY2h1bmtlZFB1c2giLCJtYWluIiwic3RhdGUiLCJzbGljZUNodW5rcyIsImNodW5rSW5kZXgiLCJnbyIsInJlc3RvcmUiLCJvbnJldHVybiIsInJldHVyblN0YXRlIiwiYm9ndXNTdGF0ZSIsImxpc3RPZkNvbnN0cnVjdHMiLCJjb25zdHJ1Y3RJbmRleCIsImhhbmRsZUxpc3RPZkNvbnN0cnVjdHMiLCJoYW5kbGVDb25zdHJ1Y3QiLCJzdGFydFBvaW50Iiwic3RhcnRQcmV2aW91cyIsInN0YXJ0Q3VycmVudENvbnN0cnVjdCIsInN0YXJ0RXZlbnRzSW5kZXgiLCJzdGFydFN0YWNrIiwic3RvcmUiLCJyZXNvbHZlVG8iLCJyZWdleCIsInJlZ2V4Q2hlY2siLCJtYXJrZG93bkxpbmVFbmRpbmdPclNwYWNlIiwidW5pY29kZVdoaXRlc3BhY2UiLCJ1bmljb2RlUHVuY3R1YXRpb24iLCJjbGFzc2lmeUNoYXJhY3RlciIsInNlcXVlbmNlIiwiX29wZW4iLCJfY2xvc2UiLCJncm91cCIsIm9wZW5pbmdTZXF1ZW5jZSIsImNsb3NpbmdTZXF1ZW5jZSIsInVzZSIsIm5leHRFdmVudHMiLCJtb3ZlUG9pbnQiLCJpbnNpZGVTcGFuIiwiYXNjaWlBbHBoYSIsInNjaGVtZU9yRW1haWxBdGV4dCIsImFzY2lpQXRleHQiLCJlbWFpbEF0ZXh0IiwiYXNjaWlBbHBoYW51bWVyaWMiLCJzY2hlbWVJbnNpZGVPckVtYWlsQXRleHQiLCJ1cmxJbnNpZGUiLCJhc2NpaUNvbnRyb2wiLCJlbWFpbEF0U2lnbk9yRG90IiwiZW1haWxMYWJlbCIsImVtYWlsVmFsdWUiLCJibG9ja1F1b3RlIiwiYXNjaWlQdW5jdHVhdGlvbiIsImNoYXJhY3RlcnMiLCJjaGFyYWN0ZXJFbnRpdGllcyIsIl9pbnRlcm9wRGVmYXVsdExlZ2FjeSIsImRlZmF1bHQiLCJkZWNvZGVFbnRpdHlfX2RlZmF1bHQiLCJkZWNvZGVFbnRpdHkiLCJjaGFyYWN0ZXJSZWZlcmVuY2UiLCJudW1lcmljIiwiYXNjaWlIZXhEaWdpdCIsImFzY2lpRGlnaXQiLCJjb2RlRmVuY2VkIiwiY2xvc2luZ0ZlbmNlQ29uc3RydWN0IiwiY2xvc2luZ1NlcXVlbmNlU3RhcnQiLCJzaXplT3BlbiIsImNsb3NpbmdTZXF1ZW5jZUVuZCIsImluaXRpYWxQcmVmaXgiLCJzZXF1ZW5jZU9wZW4iLCJpbmZvT3BlbiIsIm9wZW5BZnRlciIsImluZm9BZnRlciIsIm1ldGEiLCJjb2RlSW5kZW50ZWQiLCJpbmRlbnRlZENvbnRlbnRDb25zdHJ1Y3QiLCJhZnRlclByZWZpeCIsImxpdGVyYWxUeXBlIiwibGl0ZXJhbE1hcmtlclR5cGUiLCJyYXdUeXBlIiwic3RyaW5nVHlwZSIsImJhbGFuY2UiLCJkZXN0aW5hdGlvbkVuY2xvc2VkQmVmb3JlIiwiZGVzdGluYXRpb25SYXciLCJkZXN0aW5hdGlvbkVuY2xvc2VkIiwiZGVzdGluYXRpb25FbmNsb3NlZEVzY2FwZSIsImRlc3RpbmF0aW9uUmF3RXNjYXBlIiwibWFya2VyVHlwZSIsImxhYmVsIiwibGFiZWxFc2NhcGUiLCJzZWVuIiwiYXRGaXJzdFRpdGxlQnJlYWsiLCJhdFRpdGxlQnJlYWsiLCJ0aXRsZUVzY2FwZSIsImRlZmluaXRpb24iLCJpZGVudGlmaWVyIiwiZmFjdG9yeUxhYmVsIiwibGFiZWxBZnRlciIsIm5vcm1hbGl6ZUlkZW50aWZpZXIiLCJmYWN0b3J5V2hpdGVzcGFjZSIsImZhY3RvcnlEZXN0aW5hdGlvbiIsInRpdGxlQ29uc3RydWN0IiwiZGVmaW5lZCIsImZhY3RvcnlUaXRsZSIsImhlYWRpbmdBdHgiLCJmZW5jZU9wZW5JbnNpZGUiLCJoZWFkaW5nQnJlYWsiLCJodG1sRmxvdyIsImtpbmQiLCJzdGFydFRhZyIsImRlY2xhcmF0aW9uU3RhcnQiLCJ0YWdDbG9zZVN0YXJ0IiwiY29udGludWF0aW9uRGVjbGFyYXRpb25JbnNpZGUiLCJ0YWdOYW1lIiwiY29tbWVudE9wZW5JbnNpZGUiLCJjZGF0YU9wZW5JbnNpZGUiLCJodG1sUmF3TmFtZXMiLCJodG1sQmxvY2tOYW1lcyIsImJhc2ljU2VsZkNsb3NpbmciLCJjb21wbGV0ZUF0dHJpYnV0ZU5hbWVCZWZvcmUiLCJjb21wbGV0ZUNsb3NpbmdUYWdBZnRlciIsImNvbXBsZXRlRW5kIiwiY29tcGxldGVBdHRyaWJ1dGVOYW1lIiwiY29tcGxldGVBdHRyaWJ1dGVOYW1lQWZ0ZXIiLCJjb21wbGV0ZUF0dHJpYnV0ZVZhbHVlQmVmb3JlIiwiY29tcGxldGVBdHRyaWJ1dGVWYWx1ZVF1b3RlZCIsImNvbXBsZXRlQXR0cmlidXRlVmFsdWVVbnF1b3RlZCIsImNvbXBsZXRlQXR0cmlidXRlVmFsdWVRdW90ZWRBZnRlciIsImNvbXBsZXRlQWZ0ZXIiLCJjb250aW51YXRpb25Db21tZW50SW5zaWRlIiwiY29udGludWF0aW9uUmF3VGFnT3BlbiIsImNvbnRpbnVhdGlvbkNsb3NlIiwiY29udGludWF0aW9uQ2hhcmFjdGVyRGF0YUluc2lkZSIsImNvbnRpbnVhdGlvbkF0TGluZUVuZGluZyIsIm5leHRCbGFua0NvbnN0cnVjdCIsImh0bWxDb250aW51ZVN0YXJ0IiwiY29udGludWF0aW9uUmF3RW5kVGFnIiwibGFiZWxFbmQiLCJsYWJlbFN0YXJ0IiwiX2JhbGFuY2VkIiwiX2luYWN0aXZlIiwiYmFsYW5jZWQiLCJhZnRlckxhYmVsRW5kIiwicmVzb3VyY2VDb25zdHJ1Y3QiLCJmdWxsUmVmZXJlbmNlQ29uc3RydWN0IiwiY29sbGFwc2VkUmVmZXJlbmNlQ29uc3RydWN0IiwibWVkaWEiLCJfdXNlZCIsImRlc3RpbmF0aW9uQWZ0ZXIiLCJiZXR3ZWVuIiwiYWZ0ZXJMYWJlbCIsImxpbmVFbmRpbmciLCJpbml0aWFsU2l6ZSIsInRoZW1hdGljQnJlYWsiLCJhdE1hcmtlciIsImluc2lkZSIsIm9uQmxhbmsiLCJsaXN0SXRlbVByZWZpeFdoaXRlc3BhY2VDb25zdHJ1Y3QiLCJlbmRPZlByZWZpeCIsIm90aGVyUHJlZml4IiwiaW5pdGlhbEJsYW5rTGluZSIsImZ1cnRoZXJCbGFua0xpbmVzIiwibm90SW5DdXJyZW50SXRlbSIsImluZGVudENvbnN0cnVjdCIsInNldGV4dFVuZGVybGluZSIsInBhcmFncmFwaCIsImhlYWRpbmciLCIzOCIsIjkyIiwiY2hhcmFjdGVyRXNjYXBlIiwiLTUiLCItNCIsIi0zIiwiMzMiLCI0MiIsImF0dGVudGlvbiIsIjYwIiwiYXV0b2xpbmsiLCJkZWNsYXJhdGlvbk9wZW4iLCJpbnN0cnVjdGlvbiIsInRhZ09wZW4iLCJjb21tZW50T3BlbiIsImNkYXRhT3BlbiIsImRlY2xhcmF0aW9uIiwiY29tbWVudFN0YXJ0IiwiY29tbWVudFN0YXJ0RGFzaCIsImNvbW1lbnQiLCJjb21tZW50Q2xvc2UiLCJhdExpbmVFbmRpbmciLCJjZGF0YSIsImNkYXRhQ2xvc2UiLCJjZGF0YUVuZCIsImluc3RydWN0aW9uQ2xvc2UiLCJ0YWdDbG9zZSIsInRhZ0Nsb3NlQmV0d2VlbiIsInRhZ09wZW5CZXR3ZWVuIiwidGFnT3BlbkF0dHJpYnV0ZU5hbWUiLCJ0YWdPcGVuQXR0cmlidXRlTmFtZUFmdGVyIiwidGFnT3BlbkF0dHJpYnV0ZVZhbHVlQmVmb3JlIiwidGFnT3BlbkF0dHJpYnV0ZVZhbHVlUXVvdGVkIiwidGFnT3BlbkF0dHJpYnV0ZVZhbHVlVW5xdW90ZWQiLCJ0YWdPcGVuQXR0cmlidXRlVmFsdWVRdW90ZWRBZnRlciIsIjkxIiwiOTMiLCI5NSIsIjk2IiwiZ2FwIiwidGFpbEV4aXRJbmRleCIsImhlYWRFbnRlckluZGV4IiwiNDMiLCI0NSIsIjQ4IiwiNDkiLCI1MCIsIjUxIiwiNTIiLCI1MyIsIjU0IiwiNTUiLCI1NiIsIjU3IiwiNjIiLCIzNSIsIjYxIiwiMTI2IiwiLTIiLCItMSIsIjMyIiwidGV4dCQxIiwicmVzb2x2ZXIiLCJjb21iaW5lRXh0ZW5zaW9ucyIsImluaXRpYWxpemVyIiwiY3JlYXRlVG9rZW5pemVyIiwic2VhcmNoIiwiYXRDYXJyaWFnZVJldHVybiIsImVuY29kaW5nIiwibWF0Y2giLCJlbmRQb3NpdGlvbiIsImxhc3RJbmRleCIsImV4ZWMiLCJjZWlsIiwicG9zIiwiY29uZmlndXJlIiwidHJhbnNmb3JtcyIsImNhbkNvbnRhaW5Fb2xzIiwibGluayIsImF1dG9saW5rUHJvdG9jb2wiLCJvbmVudGVyZGF0YSIsImF1dG9saW5rRW1haWwiLCJhdHhIZWFkaW5nIiwiY29kZUZsb3ciLCJjb2RlRmVuY2VkRmVuY2VJbmZvIiwiY29kZUZlbmNlZEZlbmNlTWV0YSIsImNvZGVUZXh0IiwiY29kZVRleHREYXRhIiwiY29kZUZsb3dWYWx1ZSIsImRlZmluaXRpb25EZXN0aW5hdGlvblN0cmluZyIsImRlZmluaXRpb25MYWJlbFN0cmluZyIsImRlZmluaXRpb25UaXRsZVN0cmluZyIsImVtcGhhc2lzIiwiaGFyZEJyZWFrRXNjYXBlIiwiaGFyZEJyZWFrIiwiaGFyZEJyZWFrVHJhaWxpbmciLCJodG1sIiwiaHRtbEZsb3dEYXRhIiwiaHRtbFRleHQiLCJodG1sVGV4dERhdGEiLCJpbWFnZSIsImxpc3RJdGVtIiwibGlzdEl0ZW1WYWx1ZSIsIm9uZW50ZXJsaXN0aXRlbXZhbHVlIiwibGlzdE9yZGVyZWQiLCJvbmVudGVybGlzdG9yZGVyZWQiLCJsaXN0VW5vcmRlcmVkIiwib25lbnRlcnJlZmVyZW5jZSIsInJlZmVyZW5jZVN0cmluZyIsInJlc291cmNlRGVzdGluYXRpb25TdHJpbmciLCJyZXNvdXJjZVRpdGxlU3RyaW5nIiwic2V0ZXh0SGVhZGluZyIsInN0cm9uZyIsImNsb3NlciIsImF0eEhlYWRpbmdTZXF1ZW5jZSIsIm9uZXhpdGF0eGhlYWRpbmdzZXF1ZW5jZSIsIm9uZXhpdGF1dG9saW5rZW1haWwiLCJvbmV4aXRhdXRvbGlua3Byb3RvY29sIiwiY2hhcmFjdGVyRXNjYXBlVmFsdWUiLCJvbmV4aXRkYXRhIiwiY2hhcmFjdGVyUmVmZXJlbmNlTWFya2VySGV4YWRlY2ltYWwiLCJvbmV4aXRjaGFyYWN0ZXJyZWZlcmVuY2VtYXJrZXIiLCJjaGFyYWN0ZXJSZWZlcmVuY2VNYXJrZXJOdW1lcmljIiwiY2hhcmFjdGVyUmVmZXJlbmNlVmFsdWUiLCJvbmV4aXRjaGFyYWN0ZXJyZWZlcmVuY2V2YWx1ZSIsIm9uZXhpdGNvZGVmZW5jZWQiLCJjb2RlRmVuY2VkRmVuY2UiLCJvbmV4aXRjb2RlZmVuY2VkZmVuY2UiLCJvbmV4aXRjb2RlZmVuY2VkZmVuY2VpbmZvIiwib25leGl0Y29kZWZlbmNlZGZlbmNlbWV0YSIsIm9uZXhpdGNvZGVpbmRlbnRlZCIsIm9uZXhpdGNvZGV0ZXh0Iiwib25leGl0ZGVmaW5pdGlvbmRlc3RpbmF0aW9uc3RyaW5nIiwib25leGl0ZGVmaW5pdGlvbmxhYmVsc3RyaW5nIiwib25leGl0ZGVmaW5pdGlvbnRpdGxlc3RyaW5nIiwib25leGl0aGFyZGJyZWFrIiwib25leGl0aHRtbGZsb3ciLCJvbmV4aXRodG1sdGV4dCIsIm9uZXhpdGltYWdlIiwib25leGl0bGFiZWwiLCJsYWJlbFRleHQiLCJvbmV4aXRsYWJlbHRleHQiLCJvbmV4aXRsaW5lZW5kaW5nIiwib25leGl0bGluayIsIm9uZXhpdHJlZmVyZW5jZXN0cmluZyIsIm9uZXhpdHJlc291cmNlZGVzdGluYXRpb25zdHJpbmciLCJvbmV4aXRyZXNvdXJjZXRpdGxlc3RyaW5nIiwicmVzb3VyY2UiLCJvbmV4aXRyZXNvdXJjZSIsIm9uZXhpdHNldGV4dGhlYWRpbmciLCJzZXRleHRIZWFkaW5nTGluZVNlcXVlbmNlIiwib25leGl0c2V0ZXh0aGVhZGluZ2xpbmVzZXF1ZW5jZSIsInNldGV4dEhlYWRpbmdUZXh0Iiwib25leGl0c2V0ZXh0aGVhZGluZ3RleHQiLCJtZGFzdEV4dGVuc2lvbnMiLCJjb21waWxlIiwidHJlZSIsInRva2VuU3RhY2siLCJsaXN0U3RhY2siLCJzZXREYXRhIiwiZ2V0RGF0YSIsInByZXBhcmVMaXN0Iiwic3RyaW5naWZ5UG9zaXRpb24iLCJ0YWlsSW5kZXgiLCJ0YWlsRXZlbnQiLCJmaXJzdEJsYW5rTGluZUluZGV4IiwiY29udGFpbmVyQmFsYW5jZSIsImxpc3RTcHJlYWQiLCJfc3ByZWFkIiwiZCIsImFuZCIsImxhbmciLCJ1cmwiLCJkZXB0aCIsInNpYmxpbmdzIiwicmVmZXJlbmNlVHlwZSIsImZyYWdtZW50Iiwic2FmZUZyb21JbnQiLCJkZWNvZGUiLCJvcmRlcmVkIiwic3ByZWFkIiwiY2hlY2tlZCIsImNvbXBpbGVyIiwicG9zdHByb2Nlc3MiLCJwcmVwcm9jZXNzb3IiLCJQYXJzZXIiLCJkb2MiLCJlcnIiLCJvYmoiLCJjb25zdHJ1Y3RvciIsImlzQnVmZmVyIiwiaGFzT3duIiwicHJvdG90eXBlIiwidG9TdHIiLCJnT1BEIiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiYXJyIiwiaXNQbGFpbk9iamVjdCIsImhhc093bkNvbnN0cnVjdG9yIiwiaGFzSXNQcm90b3R5cGVPZiIsInNldFByb3BlcnR5IiwidGFyZ2V0IiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIm5ld1ZhbHVlIiwid3JpdGFibGUiLCJnZXRQcm9wZXJ0eSIsImV4dGVuZCIsInNyYyIsImNvcHkiLCJjb3B5SXNBcnJheSIsImNsb25lIiwiZGVlcCIsImdldFByb3RvdHlwZU9mIiwiZm4iLCJjYWxsYmFjayIsImludm9rZWQiLCJwYXJhbXMiLCJ0cm91Z2giLCJ3cmFwIiwiZm5zIiwibWlkZGxld2FyZSIsInJ1biIsIlZNZXNzYWdlIiwiVk1lc3NhZ2VQcm90b3R5cGUiLCJwcm90byIsInJlYXNvbiIsIm9yaWdpbiIsInBhcnRzIiwibG9jYXRpb24iLCJwYXJzZU9yaWdpbiIsIm1lc3NhZ2UiLCJzb3VyY2UiLCJydWxlSWQiLCJmaWxlIiwiZmF0YWwiLCJyZXF1aXJlJCQwIiwicHJvY2VzcyIsIlZGaWxlIiwib3JkZXIiLCJjb250ZW50cyIsIm1lc3NhZ2VzIiwiaGlzdG9yeSIsImN3ZCIsInByb2MiLCJhc3NlcnRQYXJ0IiwicGFydCIsInAiLCJzZXAiLCJhc3NlcnROb25FbXB0eSIsImFzc2VydFBhdGgiLCJwYXRoIiwiZGlybmFtZSIsImJhc2VuYW1lIiwiZXh0bmFtZSIsInN0ZW0iLCJmYWlsIiwidW5pZmllZCIsImZyb3plbiIsImF0dGFjaGVycyIsInRyYW5zZm9ybWVycyIsImZyZWV6ZUluZGV4IiwicHJvY2Vzc29yIiwiYXNzZXJ0VW5mcm96ZW4iLCJmcmVlemUiLCJhZGRQbHVnaW4iLCJhZGRMaXN0IiwiYWRkUHJlc2V0IiwicGx1Z2lucyIsImVudHJ5IiwiZmluZCIsInBsYWluIiwidmZpbGUiLCJhc3NlcnRQYXJzZXIiLCJuZXdhYmxlIiwiQ29tcGlsZXIiLCJhc3NlcnRDb21waWxlciIsImFzc2VydE5vZGUiLCJydW5TeW5jIiwiY29tcGxldGUiLCJhc3NlcnREb25lIiwiYmFpbCIsInByb2Nlc3NTeW5jIiwiZGVzdGluYXRpb24iLCJ0cmFuc2Zvcm1lciIsImNiIiwiZXhlY3V0b3IiLCJwaXBlbGluZSIsImN0eCIsImFzeW5jTmFtZSIsImFubm90YXRlZHRleHQiLCJyZXBlYXQiLCJyZW1hcmtvcHRpb25zIiwicmVtYXJrcGFyc2UiLCJmcm9udG1hdHRlciIsImJ1aWxkIiwiZ2V0RGV0ZWN0aW9uUmVzdWx0IiwiZ2V0U2V0dGluZ3MiLCJwYXJzZWRUZXh0IiwiUmVtYXJrLmJ1aWxkIiwiUmVtYXJrLmRlZmF1bHRzIiwiZW5hYmxlZENhdGVnb3JpZXMiLCJkaXNhYmxlZENhdGVnb3JpZXMiLCJzcGxpdCIsImdldFJ1bGVDYXRlZ29yaWVzIiwibGFuZ3VhZ2UiLCJlbmFibGVkT25seSIsImxldmVsIiwiYm9keSIsImVuYWJsZWRSdWxlcyIsImRpc2FibGVkUnVsZXMiLCJhcGlLZXkiLCJtZXRob2QiLCJtYXAiLCJlbmNvZGVVUklDb21wb25lbnQiLCJoZWFkZXJzIiwiQ29udGVudC1UeXBlIiwiQWNjZXB0IiwiTm90aWNlIiwic3RhdHVzVGV4dCIsInN0YXR1cyIsImJ1aWxkQXV0b0NoZWNrSGFuZGxlciIsImRlYm91bmNlVGltZXIiLCJtaW5SYW5nZSIsIm1heFJhbmdlIiwiRWRpdG9yVmlldyIsImlucHV0SGFuZGxlciIsIm9mIiwidG8iLCJ0cmltIiwibWFya2Rvd25WaWV3IiwiZWRpdG9yVmlld0ZpZWxkIiwiY2xlYXJUaW1lb3V0Iiwid2luZG93Iiwic2V0VGltZW91dCIsInN0YXJ0TGluZSIsImxpbmVCbG9ja0F0IiwiZW5kTGluZSIsInJ1bkRldGVjdGlvbiIsImFkZFVuZGVybGluZSIsIlN0YXRlRWZmZWN0IiwiZGVmaW5lIiwiY2xlYXJVbmRlcmxpbmVzIiwiY2xlYXJVbmRlcmxpbmVzSW5SYW5nZSIsImZpbHRlclVuZGVybGluZXMiLCJkZWNvcmF0aW9uU3RhcnQiLCJkZWNvcmF0aW9uRW5kIiwicmFuZ2VTdGFydCIsInJhbmdlRW5kIiwidW5kZXJsaW5lRmllbGQiLCJTdGF0ZUZpZWxkIiwiRGVjb3JhdGlvbiIsIm5vbmUiLCJ1bmRlcmxpbmVzIiwidHIiLCJzZWVuUmFuZ2VzIiwiU2V0Iiwic2VlblBvc2l0aW9ucyIsImNoYW5nZXMiLCJjYW5EZWNvcmF0ZSIsInN5bnRheFRyZWUiLCJub2RlUHJvcHMiLCJyZXNvbHZlSW5uZXIiLCJ0b2tlbkNsYXNzTm9kZVByb3AiLCJpc1J1bGVBbGxvd2VkIiwicnVsZSIsImNhdGVnb3J5IiwiaWQiLCJzcGVsbGNoZWNrRGljdGlvbmFyeSIsInZhdWx0IiwiZ2V0Q29uZmlnIiwic3RyIiwic2xpY2VEb2MiLCJpbmNsdWRlcyIsImxpbmVOb2RlUHJvcCIsIm5ld0RvYyIsImxpbmVBdCIsImRvY0NoYW5nZWQiLCJzZWxlY3Rpb24iLCJ1cGRhdGUiLCJmaWx0ZXIiLCJpcyIsIm1hcmsiLCJjbGFzcyIsInByb3ZpZGUiLCJmIiwiZGVjb3JhdGlvbnMiLCJjb250cnVjdFRvb2x0aXAiLCJ1bmRlcmxpbmUiLCJzaG9ydE1lc3NhZ2UiLCJidXR0b25zIiwibWFpbkNsYXNzIiwiY3JlYXRlRGl2IiwiY2xzIiwicm9vdCIsImNyZWF0ZVNwYW4iLCJzcGFuIiwiY2xlYXJVbmRlcmxpbmVFZmZlY3QiLCJidXR0b25Db250YWluZXIiLCJidG5UZXh0Iiwib25jbGljayIsImRpc3BhdGNoIiwiaW5zZXJ0IiwiY29udGFpbmVyIiwic2V0Q29uZmlnIiwiZ2V0VG9vbHRpcCIsInRvb2x0aXBzIiwicmFuZ2VzIiwicHJpbWFyeVVuZGVybGluZSIsInNwZWMiLCJ0b29sdGlwIiwiYWJvdmUiLCJzdHJpY3RTaWRlIiwiYXJyb3ciLCJkb20iLCJidWlsZFRvb2x0aXBGaWVsZCIsInNob3dUb29sdGlwIiwiY29tcHV0ZU4iLCJMZWdhY3lXaWRnZXQiLCJjbGFzc1RvVXNlIiwiZWxlbSIsInN0eWxlIiwiYm90dG9tIiwiYWRkVG9EaWN0aW9uYXJ5IiwibWF0Y2hlZFN0cmluZyIsImlnbm9yZVN1Z2dlc3Rpb24iLCJhcHBlbmQiLCJoZWlnaHQiLCJjbGllbnRIZWlnaHQiLCJ3aWR0aCIsImNsaWVudFdpZHRoIiwiaW5uZXJIZWlnaHQiLCJ0b3AiLCJpbm5lcldpZHRoIiwiZWxlbWVudCIsImxlZ2FjeVNob3VsZENoZWNrVGV4dEF0UG9zIiwiaW5zdGFuY2UiLCJnZXRMaW5lIiwidG9rZW5zIiwiZ2V0VG9rZW5UeXBlQXQiLCJsZWdhY3lDbGVhck1hcmtzIiwibWFya2VyTWFwIiwiZWRpdG9yIiwiY2xlYXJNYXJrIiwiYXR0cmlidXRlcyIsImlzSWdub3JlZCIsImZpbmRNYXJrcyIsImdldEFsbE1hcmtzIiwiTGVnYWN5TGFuZ3VhZ2VUb29sUGx1Z2luIiwiZGVsdGEiLCJvcGVuV2lkZ2V0IiwiZGVzdHJveSIsIm1hcmtzIiwiZmluZE1hcmtzQXQiLCJkaXJ0eUxpbmVzIiwiXyIsInNldFN0YXR1c0JhcldvcmtpbmciLCJjaGVja0xpbmVzIiwic2V0U3RhdHVzQmFyUmVhZHkiLCJsaW5lc1RvQ2hlY2siLCJzb3J0IiwiYiIsImxhc3RMaW5lSW5kZXgiLCJsYXN0TGluZSIsImNoIiwiaGFzaExydSIsIldlYWtNYXAiLCJkZWJvdW5jZSIsInJ1bkF1dG9EZXRlY3Rpb24iLCJpbml0TGVnYWN5RWRpdG9ySGFuZGxlciIsIndvcmtzcGFjZSIsIml0ZXJhdGVDb2RlTWlycm9ycyIsImNtIiwib2ZmIiwib25Db2RlbWlycm9yQ2hhbmdlIiwicmVnaXN0ZXJDb2RlTWlycm9yIiwib24iLCJyZWdpc3RlckRvbUV2ZW50IiwiZ2V0QWN0aXZlVmlld09mVHlwZSIsIk1hcmtkb3duVmlldyIsImNvbnRhaW5zIiwiSFRNTEVsZW1lbnQiLCJoYXNDbGFzcyIsImdldFdyYXBwZXJFbGVtZW50IiwibGluZUNoIiwiY29vcmRzQ2hhciIsImNsaWVudFgiLCJjbGllbnRZIiwiY3Vyc29yQ29vcmRzIiwiZ2V0UmFuZ2UiLCJyZXBsYWNlUmFuZ2UiLCJtYXJrVGV4dCIsImNsZWFyT25FbnRlciIsInNlbGVjdGlvbkZyb20iLCJzZWxlY3Rpb25UbyIsImdldERvYyIsImdldFZhbHVlIiwiaW5kZXhGcm9tUG9zIiwibWF0Y2hlcyIsInBvc0Zyb21JbmRleCIsIm1hdGNoQWxsb3dlZCIsImNsYXNzTmFtZSIsImxpbmVUb2tlbnMiLCJnZXRMaW5lVG9rZW5zIiwiTGFuZ3VhZ2VUb29sUGx1Z2luIiwiUGx1Z2luIiwic3RhdHVzQmFyUmVjdCIsInN0YXR1c0JhclRleHQiLCJwYXJlbnRFbGVtZW50IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwic3RhdHVzQmFySWNvblJlY3QiLCJNZW51IiwiYWRkSXRlbSIsInNldFRpdGxlIiwiYWN0aXZlTGVhZiIsImdldE1vZGUiLCJpc0xlZ2FjeUVkaXRvciIsImxlZ2FjeVBsdWdpbiIsInNob3dBdFBvc2l0aW9uIiwieCIsInkiLCJCb29sZWFuIiwibG9hZFNldHRpbmdzIiwiYWRkU2V0dGluZ1RhYiIsIm9uTGF5b3V0UmVhZHkiLCJhZGRTdGF0dXNCYXJJdGVtIiwiaGFuZGxlU3RhdHVzQmFyQ2xpY2siLCJvbmxvYWQiLCJyZWdpc3RlckVkaXRvckV4dGVuc2lvbiIsInRvb2x0aXBTcGFjZSIsInJlY3QiLCJyZWdpc3RlckNvbW1hbmRzIiwib251bmxvYWQiLCJhZGRDb21tYW5kIiwiZWRpdG9yQ2FsbGJhY2siLCJzb21ldGhpbmdTZWxlY3RlZCIsImdldEN1cnNvciIsImlzbG9hZGluZyIsImlzUmFuZ2UiLCJyYW5nZUZyb20iLCJyYW5nZVRvIiwibG9hZERhdGEiLCJzYXZlRGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Z0ZBcUVPLFNBQVNBLEVBQVVDLEVBQVNDLEVBQVlDLEVBQUdDLEdBRTlDLE9BQU8sSUFBS0QsSUFBTUEsRUFBSUUsV0FBVSxTQUFVQyxFQUFTQyxHQUMvQyxTQUFTQyxFQUFVQyxHQUFTLElBQU1DLEVBQUtOLEVBQVVPLEtBQUtGLElBQVcsTUFBT0csR0FBS0wsRUFBT0ssSUFDcEYsU0FBU0MsRUFBU0osR0FBUyxJQUFNQyxFQUFLTixFQUFpQixNQUFFSyxJQUFXLE1BQU9HLEdBQUtMLEVBQU9LLElBQ3ZGLFNBQVNGLEVBQUtJLEdBQVVBLEVBQU9DLEtBQU9ULEVBQVFRLEVBQU9MLE9BSnpELFNBQWVBLEdBQVMsT0FBT0EsYUFBaUJOLEVBQUlNLEVBQVEsSUFBSU4sR0FBRSxTQUFVRyxHQUFXQSxFQUFRRyxNQUk3Qk8sQ0FBTUYsRUFBT0wsT0FBT1EsS0FBS1QsRUFBV0ssR0FDbEdILEdBQU1OLEVBQVlBLEVBQVVjLE1BQU1qQixFQUFTQyxHQUFjLEtBQUtTLFdDM0V2RCxNQUFNUSxFQUNwQkMsWUFBWUMsRUFBVSxJQUNyQixLQUFNQSxFQUFRQyxTQUFXRCxFQUFRQyxRQUFVLEdBQzFDLE1BQU0sSUFBSUMsVUFBVSw2Q0FHckIsR0FBOEIsaUJBQW5CRixFQUFRRyxRQUEw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
