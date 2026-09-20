/* @ds-bundle: {"format":3,"namespace":"BenYanAIDesignSystem_5a2b7b","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Metric","sourcePath":"components/data/Metric.jsx"},{"name":"ProgressSteps","sourcePath":"components/data/ProgressSteps.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Callout","sourcePath":"components/surfaces/Callout.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"CaseCard","sourcePath":"components/surfaces/CaseCard.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"156459902234","components/core/Badge.jsx":"dcfff65201ae","components/core/Button.jsx":"e95084acc45c","components/core/Eyebrow.jsx":"24a34ddaccb6","components/core/Tag.jsx":"eaa1a4e29b3b","components/data/Metric.jsx":"14249881952c","components/data/ProgressSteps.jsx":"18cc9863f1a4","components/navigation/Tabs.jsx":"f49071a8dc26","components/surfaces/Callout.jsx":"f765fa019626","components/surfaces/Card.jsx":"bc28d722697a","components/surfaces/CaseCard.jsx":"59fd904e16eb","ui_kits/web/App.jsx":"6f905e6acf7e","ui_kits/web/Parts1.jsx":"859faeda6b8a","ui_kits/web/Parts2.jsx":"9515239e4b36"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BenYanAIDesignSystem_5a2b7b = window.BenYanAIDesignSystem_5a2b7b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Avatar
 * Initials or image avatar. Used for instructors, participants, testimonials.
 */
function Avatar({
  name = '',
  src = null,
  size = 40,
  tone = 'brand',
  style = {},
  ...rest
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const tones = {
    brand: ['var(--emerald-100)', 'var(--emerald-800)'],
    ink: ['var(--ink-700)', '#fff'],
    soft: ['var(--ink-100)', 'var(--ink-600)']
  };
  const [bg, fg] = tones[tone] || tones.brand;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '999px',
      background: src ? 'transparent' : bg,
      color: fg,
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: Math.round(size * 0.38),
      overflow: 'hidden',
      flex: 'none',
      border: '2px solid var(--white)',
      boxShadow: 'var(--shadow-xs)',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Badge
 * Compact status / category label. Tones map to semantic accents.
 */
function Badge({
  children,
  tone = 'brand',
  solid = false,
  dot = false,
  style = {},
  ...rest
}) {
  const tones = {
    brand: {
      soft: ['var(--emerald-100)', 'var(--emerald-800)'],
      solid: ['var(--brand)', '#fff'],
      dot: 'var(--brand)'
    },
    neutral: {
      soft: ['var(--ink-100)', 'var(--ink-700)'],
      solid: ['var(--ink-700)', '#fff'],
      dot: 'var(--ink-400)'
    },
    success: {
      soft: ['var(--emerald-100)', 'var(--emerald-800)'],
      solid: ['var(--emerald-600)', '#fff'],
      dot: 'var(--emerald-500)'
    },
    warning: {
      soft: ['var(--amber-100)', 'var(--amber-500)'],
      solid: ['var(--amber-500)', '#fff'],
      dot: 'var(--amber-500)'
    },
    risk: {
      soft: ['var(--rose-100)', 'var(--rose-500)'],
      solid: ['var(--rose-500)', '#fff'],
      dot: 'var(--rose-500)'
    },
    info: {
      soft: ['var(--blue-100)', 'var(--blue-500)'],
      solid: ['var(--blue-500)', '#fff'],
      dot: 'var(--blue-500)'
    }
  };
  const t = tones[tone] || tones.brand;
  const [bg, fg] = solid ? t.solid : t.soft;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: bg,
      color: fg,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: '0.02em',
      padding: '3px 9px',
      borderRadius: 'var(--radius-sm)',
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: solid ? 'rgba(255,255,255,.8)' : t.dot
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Button
 * Variants: primary (emerald), secondary (ink outline), ghost, dark, soft.
 * Sizes: sm, md, lg. Optional leading/trailing icon nodes.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  disabled = false,
  full = false,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      height: 'var(--control-h-sm)',
      padding: '0 14px',
      fontSize: 'var(--text-sm)',
      radius: 'var(--radius-sm)',
      gap: '7px'
    },
    md: {
      height: 'var(--control-h-md)',
      padding: '0 20px',
      fontSize: 'var(--text-md)',
      radius: 'var(--radius-md)',
      gap: '9px'
    },
    lg: {
      height: 'var(--control-h-lg)',
      padding: '0 28px',
      fontSize: 'var(--text-lg)',
      radius: 'var(--radius-md)',
      gap: '10px'
    }
  };
  const variants = {
    primary: {
      background: 'var(--brand)',
      color: 'var(--text-on-brand)',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-sm)'
    },
    secondary: {
      background: 'var(--surface-card)',
      color: 'var(--text-body)',
      border: '1px solid var(--border-strong)',
      boxShadow: 'var(--shadow-xs)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-brand)',
      border: '1px solid transparent',
      boxShadow: 'none'
    },
    dark: {
      background: 'var(--ink-800)',
      color: '#fff',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-sm)'
    },
    soft: {
      background: 'var(--surface-brand-soft)',
      color: 'var(--emerald-800)',
      border: '1px solid var(--emerald-200)',
      boxShadow: 'none'
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    style: {
      display: full ? 'flex' : 'inline-flex',
      width: full ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      fontSize: s.fontSize,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: '-0.005em',
      lineHeight: 1,
      borderRadius: s.radius,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'transform var(--dur-fast) var(--ease-standard), filter var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
      whiteSpace: 'nowrap',
      ...v,
      ...style
    },
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.filter = 'none';
      e.currentTarget.style.transform = 'none';
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'translateY(1px)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'none';
    }
  }, rest), iconLeft ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      fontSize: '1.05em'
    }
  }, iconLeft) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      fontSize: '1.05em'
    }
  }, iconRight) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Eyebrow
 * All-caps brand label with the signature leading tick. Sits above titles.
 */
function Eyebrow({
  children,
  tick = true,
  tone = 'brand',
  style = {},
  ...rest
}) {
  const color = tone === 'muted' ? 'var(--text-muted)' : tone === 'onDark' ? 'var(--emerald-300)' : 'var(--text-brand)';
  const tickColor = tone === 'onDark' ? 'var(--emerald-400)' : 'var(--brand)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--text-xs)',
      letterSpacing: 'var(--tracking-wider)',
      textTransform: 'uppercase',
      color,
      ...style
    }
  }, rest), tick ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 2,
      background: tickColor,
      flex: 'none'
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Tag
 * Topic / keyword chip. Pill-shaped, low emphasis. Optional removable.
 */
function Tag({
  children,
  active = false,
  onRemove = null,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      background: active ? 'var(--surface-brand-soft)' : 'var(--surface-card)',
      color: active ? 'var(--emerald-800)' : 'var(--text-muted)',
      border: `1px solid ${active ? 'var(--emerald-200)' : 'var(--border-default)'}`,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-medium)',
      fontSize: 'var(--text-xs)',
      padding: '5px 12px',
      borderRadius: 'var(--radius-pill)',
      lineHeight: 1.3,
      cursor: rest.onClick ? 'pointer' : 'default',
      transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), children, onRemove ? /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      display: 'inline-flex',
      cursor: 'pointer',
      color: 'var(--text-faint)',
      fontSize: '1.1em',
      lineHeight: 1
    }
  }, "\xD7") : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/Metric.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Metric
 * Big KPI figure with label and optional delta / caption.
 * Mono numerals reinforce the data-credible, methodology tone.
 */
function Metric({
  value,
  label,
  caption = null,
  delta = null,
  trend = 'up',
  align = 'left',
  size = 'md',
  style = {},
  ...rest
}) {
  const sizes = {
    sm: 'var(--text-3xl)',
    md: 'var(--text-4xl)',
    lg: 'var(--text-5xl)'
  };
  const trendColor = trend === 'down' ? 'var(--rose-500)' : trend === 'flat' ? 'var(--ink-400)' : 'var(--emerald-600)';
  const arrow = trend === 'down' ? '↓' : trend === 'flat' ? '→' : '↑';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: sizes[size] || sizes.md,
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)',
      lineHeight: 1
    }
  }, value), delta ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--text-sm)',
      color: trendColor
    }
  }, /*#__PURE__*/React.createElement("span", null, arrow), delta) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, label), caption ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)',
      lineHeight: 1.5
    }
  }, caption) : null);
}
Object.assign(__ds_scope, { Metric });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Metric.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressSteps.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — ProgressSteps
 * Numbered methodology / module stepper. Horizontal or vertical.
 * steps: [{ title, desc?, status? }]  status: 'done' | 'current' | 'todo'
 */
function ProgressSteps({
  steps = [],
  orientation = 'horizontal',
  style = {},
  ...rest
}) {
  const isH = orientation === 'horizontal';
  const node = (st, idx) => {
    const status = st.status || (idx === 0 ? 'current' : 'todo');
    const done = status === 'done';
    const current = status === 'current';
    const bg = done ? 'var(--brand)' : current ? 'var(--ink-800)' : 'var(--surface-card)';
    const fg = done || current ? '#fff' : 'var(--text-faint)';
    const bd = done ? 'var(--brand)' : current ? 'var(--ink-800)' : 'var(--border-default)';
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      style: {
        display: 'flex',
        flexDirection: isH ? 'column' : 'row',
        gap: isH ? 12 : 16,
        alignItems: isH ? 'flex-start' : 'flex-start',
        flex: isH ? 1 : 'none',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: isH ? 'row' : 'column',
        alignItems: 'center',
        gap: 0,
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 999,
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color: fg,
        border: `1.5px solid ${bd}`,
        fontFamily: 'var(--font-mono)',
        fontWeight: 'var(--fw-semibold)',
        fontSize: 'var(--text-sm)',
        boxShadow: current ? 'var(--ring-brand)' : 'none'
      }
    }, done ? '✓' : String(idx + 1).padStart(2, '0')), !isH && idx < steps.length - 1 ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 1.5,
        flex: 1,
        minHeight: 28,
        background: 'var(--border-default)',
        marginTop: 4
      }
    }) : null), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        paddingBottom: isH ? 0 : 22
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 'var(--fw-bold)',
        fontSize: 'var(--text-md)',
        color: current || done ? 'var(--text-strong)' : 'var(--text-muted)',
        lineHeight: 1.3
      }
    }, st.title), st.desc ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-xs)',
        color: 'var(--text-faint)',
        lineHeight: 1.55
      }
    }, st.desc) : null));
  };
  if (isH) {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        ...style
      }
    }, rest), steps.map((st, idx) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: idx
    }, node(st, idx), idx < steps.length - 1 ? /*#__PURE__*/React.createElement("span", {
      style: {
        height: 1.5,
        flex: '0 0 28px',
        alignSelf: 'flex-start',
        marginTop: 16,
        background: st.status === 'done' ? 'var(--brand)' : 'var(--border-default)'
      }
    }) : null)));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, rest), steps.map(node));
}
Object.assign(__ds_scope, { ProgressSteps });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressSteps.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Tabs
 * Underline-style tab bar. Controlled or uncontrolled.
 * items: [{ id, label, badge? }]
 */
function Tabs({
  items = [],
  value = null,
  defaultValue = null,
  onChange = null,
  style = {},
  ...rest
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = value != null ? value : internal;
  const select = id => {
    if (value == null) setInternal(id);
    if (onChange) onChange(id);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-default)',
      ...style
    }
  }, rest), items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      onClick: () => select(it.id),
      style: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '11px 16px',
        marginBottom: -1,
        fontFamily: 'var(--font-sans)',
        fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)',
        fontSize: 'var(--text-sm)',
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        borderBottom: `2px solid ${on ? 'var(--brand)' : 'transparent'}`,
        transition: 'color var(--dur-fast) var(--ease-standard)',
        whiteSpace: 'nowrap'
      },
      onMouseEnter: e => {
        if (!on) e.currentTarget.style.color = 'var(--text-body)';
      },
      onMouseLeave: e => {
        if (!on) e.currentTarget.style.color = 'var(--text-muted)';
      }
    }, it.label, it.badge != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-2xs)',
        background: on ? 'var(--surface-brand-soft)' : 'var(--surface-sunken)',
        color: on ? 'var(--emerald-700)' : 'var(--text-faint)',
        borderRadius: 'var(--radius-pill)',
        padding: '1px 7px'
      }
    }, it.badge) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Callout.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Callout
 * Methodology note / tip / warning block. Left brand keyline, soft tint.
 */
function Callout({
  children,
  title = null,
  tone = 'brand',
  icon = null,
  style = {},
  ...rest
}) {
  const tones = {
    brand: {
      bg: 'var(--surface-brand-soft)',
      bar: 'var(--brand)',
      fg: 'var(--emerald-900)'
    },
    neutral: {
      bg: 'var(--surface-sunken)',
      bar: 'var(--ink-400)',
      fg: 'var(--ink-800)'
    },
    warning: {
      bg: 'var(--amber-100)',
      bar: 'var(--amber-500)',
      fg: '#6b4a09'
    },
    risk: {
      bg: 'var(--rose-100)',
      bar: 'var(--rose-500)',
      fg: '#71221b'
    },
    info: {
      bg: 'var(--blue-100)',
      bar: 'var(--blue-500)',
      fg: '#1d3f59'
    }
  };
  const t = tones[tone] || tones.brand;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 13,
      background: t.bg,
      borderLeft: `3px solid ${t.bar}`,
      borderRadius: '0 var(--radius-md) var(--radius-md) 0',
      padding: '14px 18px',
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.15em',
      lineHeight: 1.5,
      color: t.bar,
      flex: 'none'
    }
  }, icon) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--text-sm)',
      color: t.fg
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      lineHeight: 1.6,
      color: t.fg,
      opacity: 0.92
    }
  }, children)));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Callout.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — Card
 * Base surface container. Optional top accent rule and elevation.
 */
function Card({
  children,
  elevation = 'sm',
  accent = false,
  interactive = false,
  pad = 24,
  style = {},
  ...rest
}) {
  const shadows = {
    none: 'none',
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: shadows[elevation] ?? shadows.sm,
      padding: pad,
      overflow: 'hidden',
      transition: 'transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
      ...style
    },
    onMouseEnter: interactive ? e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = shadows[elevation] ?? shadows.sm;
    } : undefined
  }, rest), accent ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: 3,
      width: 48,
      background: 'var(--brand)',
      borderRadius: '0 0 var(--radius-pill) 0'
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/CaseCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BenYan AI — CaseCard
 * Enterprise case-study card: badge + title + summary + KPI metrics + tags.
 * The core unit of "案例卡片" (case cards) and workshop materials.
 */
function CaseCard({
  industry = '案例',
  tone = 'brand',
  title,
  summary,
  metrics = [],
  tags = [],
  status = null,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: '22px 24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      overflow: 'hidden',
      transition: 'transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
      ...style
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: 3,
      width: 56,
      background: 'var(--grad-brand)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: tone
  }, industry), status ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-faint)',
      letterSpacing: '.04em'
    }
  }, status) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--text-xl)',
      lineHeight: 1.25,
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title), summary ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      lineHeight: 1.65,
      color: 'var(--text-muted)',
      margin: 0
    }
  }, summary) : null), metrics.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      padding: '12px 0 2px',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, metrics.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--text-2xl)',
      color: 'var(--brand-strong)',
      letterSpacing: '-.02em',
      lineHeight: 1
    }
  }, m.value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-faint)',
      letterSpacing: '.02em'
    }
  }, m.label)))) : null, tags.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, tags.map((t, i) => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: i
  }, t))) : null);
}
Object.assign(__ds_scope, { CaseCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/CaseCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/App.jsx
try { (() => {
/* BenYan AI — Web UI kit: App shell + booking modal */
const DSa = window.BenYanAIDesignSystem_5a2b7b;
function BookingModal({
  open,
  onClose
}) {
  const {
    Button,
    Eyebrow
  } = DSa;
  const [sent, setSent] = React.useState(false);
  React.useEffect(() => {
    if (open) setSent(false);
  }, [open]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      background: 'rgba(20,27,33,.46)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 480,
      maxWidth: '100%',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      padding: 34,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      position: 'absolute',
      top: 18,
      right: 18,
      background: 'none',
      border: 'none',
      fontSize: 22,
      color: 'var(--text-faint)',
      cursor: 'pointer'
    }
  }, "\xD7"), sent ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '20px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 999,
      background: 'var(--surface-brand-soft)',
      color: 'var(--brand)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      margin: '0 auto 18px'
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 24,
      margin: '0 0 8px',
      color: 'var(--text-strong)'
    }
  }, "\u5DF2\u6536\u5230\uFF0C\u8C22\u8C22\uFF01"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      margin: '0 0 24px'
    }
  }, "\u987E\u95EE\u5C06\u5728 1 \u4E2A\u5DE5\u4F5C\u65E5\u5185\u4E0E\u4F60\u8054\u7CFB\u3002"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onClose
  }, "\u597D\u7684")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Eyebrow, null, "\u9884\u7EA6\u5185\u8BAD\u8BCA\u65AD"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: '-.02em',
      margin: '14px 0 6px',
      color: 'var(--text-strong)'
    }
  }, "\u7559\u4E0B\u4FE1\u606F\uFF0C\u5F00\u59CB\u5BF9\u8BDD"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      margin: '0 0 22px',
      fontSize: 15
    }
  }, "\u6211\u4EEC\u5C06\u4E3A\u4F60\u5B9A\u5236\u4E00\u6B21 60 \u5206\u949F\u7684\u573A\u666F\u8BCA\u65AD\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, [['企业名称', '如：BenYan 科技'], ['联系人', '你的称呼'], ['联系方式', '手机 / 邮箱']].map(([l, ph]) => /*#__PURE__*/React.createElement("label", {
    key: l,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, l), /*#__PURE__*/React.createElement("input", {
    placeholder: ph,
    style: {
      height: 44,
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)',
      background: 'var(--paper)',
      padding: '0 14px',
      fontSize: 15,
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-body)',
      outline: 'none'
    },
    onFocus: e => {
      e.target.style.borderColor = 'var(--brand)';
      e.target.style.boxShadow = 'var(--ring-brand)';
    },
    onBlur: e => {
      e.target.style.borderColor = 'var(--border-default)';
      e.target.style.boxShadow = 'none';
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    full: true,
    onClick: () => setSent(true)
  }, "\u63D0\u4EA4\u9884\u7EA6")))));
}
function App() {
  const {
    Header,
    Hero
  } = window.WebKitParts;
  const {
    Courses,
    Cases,
    Footer
  } = window.WebKitParts2;
  const [open, setOpen] = React.useState(false);
  const book = () => setOpen(true);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Header, {
    onBook: book
  }), /*#__PURE__*/React.createElement(Hero, {
    onBook: book
  }), /*#__PURE__*/React.createElement(Courses, null), /*#__PURE__*/React.createElement(Cases, null), /*#__PURE__*/React.createElement(Footer, {
    onBook: book
  }), /*#__PURE__*/React.createElement(BookingModal, {
    open: open,
    onClose: () => setOpen(false)
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Parts1.jsx
try { (() => {
/* BenYan AI — Web UI kit: course showcase site
   Composes the design-system components from the compiled bundle. */
const DS = window.BenYanAIDesignSystem_5a2b7b;
const {
  Button,
  Eyebrow,
  Badge,
  Tag,
  CaseCard,
  Metric,
  Tabs,
  Avatar
} = DS;
const LOGO = '../../assets/logo-appicon.png';

/* ---------------- Header ---------------- */
function Header({
  onBook
}) {
  const nav = ['课程体系', '实战案例', '方法论', '师资'];
  const [active, setActive] = React.useState('课程体系');
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'rgba(247,250,248,0.82)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: '0 auto',
      padding: '0 32px',
      height: 68,
      display: 'flex',
      alignItems: 'center',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO,
    alt: "",
    style: {
      height: 34,
      borderRadius: 9
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 18,
      letterSpacing: '-.01em',
      color: 'var(--text-strong)'
    }
  }, "BenYan", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, " AI"))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 4,
      marginLeft: 8
    }
  }, nav.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setActive(n),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px 14px',
      borderRadius: 8,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: active === n ? 600 : 500,
      color: active === n ? 'var(--text-strong)' : 'var(--text-muted)'
    }
  }, n))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "\u767B\u5F55"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: onBook
  }, "\u9884\u7EA6\u4F01\u4E1A\u5185\u8BAD")));
}

/* ---------------- Hero ---------------- */
function Hero({
  onBook
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--grad-dark)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -120,
      top: -160,
      width: 560,
      height: 860,
      background: 'var(--grad-wing)',
      opacity: .16,
      transform: 'rotate(10deg)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: '0 auto',
      padding: '92px 32px 84px',
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "onDark"
  }, "\u4F01\u4E1A AI \u8D4B\u80FD \xB7 \u8BFE\u7A0B\u4E0E\u54A8\u8BE2"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 64,
      lineHeight: 1.06,
      letterSpacing: '-.025em',
      color: '#fff',
      margin: '22px 0 0',
      maxWidth: 820
    }
  }, "\u628A AI \u80FD\u529B\uFF0C", /*#__PURE__*/React.createElement("br", null), "\u6C89\u6DC0\u4E3A\u4F01\u4E1A\u7684", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--emerald-300)'
    }
  }, "\u5DE5\u4F5C\u6D41")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 21,
      lineHeight: 1.6,
      color: 'rgba(255,255,255,.82)',
      maxWidth: 620,
      marginTop: 24
    }
  }, "\u9762\u5411\u7814\u53D1\u3001\u4EA7\u54C1\u4E0E\u7BA1\u7406\u56E2\u961F\u7684\u4F53\u7CFB\u5316\u8BFE\u7A0B\u3002\u4ECE\u8BA4\u77E5\u6821\u51C6\u5230\u573A\u666F\u843D\u5730\uFF0C\u914D\u5957\u771F\u5B9E\u6848\u4F8B\u3001\u8BC4\u4F30\u6E05\u5355\u4E0E\u53EF\u590D\u7528\u6A21\u677F\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onBook,
    iconRight: "\u2192"
  }, "\u9884\u7EA6\u5185\u8BAD\u8BCA\u65AD"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    style: {
      background: 'rgba(255,255,255,.06)',
      color: '#fff',
      borderColor: 'rgba(255,255,255,.22)'
    }
  }, "\u67E5\u770B\u8BFE\u7A0B\u5927\u7EB2")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 40,
      marginTop: 56
    }
  }, [['120+', '服务企业'], ['8,000+', '学员'], ['4.9/5', '满意度']].map(([v, l]) => /*#__PURE__*/React.createElement("div", {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 30,
      color: 'var(--emerald-300)',
      letterSpacing: '-.02em'
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-on-dark-muted)',
      marginTop: 4
    }
  }, l))))));
}
window.WebKitParts = {
  Header,
  Hero
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Parts1.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Parts2.jsx
try { (() => {
/* BenYan AI — Web UI kit: courses, cases, footer */
const DS2 = window.BenYanAIDesignSystem_5a2b7b;
const COURSES = [{
  code: 'C-01',
  title: 'AI 洞察及应用',
  desc: '校准认知，建立 AI 机会地图与判断框架。',
  dur: '2 天',
  level: '管理层',
  tags: ['认知校准', '机会识别']
}, {
  code: 'C-02',
  title: 'AI 研发体系建设',
  desc: '把 AI 编码与协作沉淀为工程化、可度量的能力。',
  dur: '3 天',
  level: '研发团队',
  tags: ['工程化', '质量门禁']
}, {
  code: 'C-03',
  title: '企业 AI 应用场景设计',
  desc: '从场景识别到价值评估，设计可落地的工作流。',
  dur: '2 天',
  level: '产品/业务',
  tags: ['场景设计', 'ROI 评估']
}];
function Courses() {
  const {
    Eyebrow,
    Tag
  } = DS2;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1180,
      margin: '0 auto',
      padding: '88px 32px 40px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u8BFE\u7A0B\u4F53\u7CFB \xB7 Curriculum"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 40,
      letterSpacing: '-.022em',
      color: 'var(--text-strong)',
      margin: '16px 0 8px'
    }
  }, "\u4E09\u95E8\u8BFE\uFF0C\u4E00\u6761\u843D\u5730\u4E3B\u7EBF"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: 'var(--text-muted)',
      margin: '0 0 40px',
      maxWidth: 560
    }
  }, "\u6A21\u5757\u53EF\u72EC\u7ACB\u4EA4\u4ED8\uFF0C\u4E5F\u53EF\u7EC4\u5408\u4E3A\u4F01\u4E1A AI \u8F6C\u578B\u7684\u5B8C\u6574\u7814\u4FEE\u8DEF\u5F84\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 22
    }
  }, COURSES.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.code,
    className: "hovcard",
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: 26,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      overflow: 'hidden',
      transition: 'transform .2s, box-shadow .2s'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: 3,
      width: 48,
      background: 'var(--brand)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--text-faint)',
      letterSpacing: '.06em'
    }
  }, c.code), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--emerald-700)',
      background: 'var(--surface-brand-soft)',
      border: '1px solid var(--emerald-200)',
      borderRadius: 999,
      padding: '2px 10px'
    }
  }, c.dur, " \xB7 ", c.level)), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 24,
      color: 'var(--text-strong)',
      margin: 0
    }
  }, c.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--text-muted)',
      margin: 0,
      flex: 1
    }
  }, c.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, c.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t)))))));
}
const CASES = [{
  id: 'fin',
  cat: '金融',
  industry: '金融 · 风控',
  status: '12 周 · 已交付',
  title: '智能信贷审核助手',
  summary: '大模型嵌入审批流，自动抽取要素并生成初核意见。',
  metrics: [{
    value: '+38%',
    label: '审核效率'
  }, {
    value: '4.2×',
    label: 'ROI'
  }],
  tags: ['研发提效', '风控']
}, {
  id: 'mfg',
  cat: '制造',
  industry: '制造 · 质检',
  status: '8 周 · 试点',
  title: '产线缺陷知识助手',
  summary: '统一质检知识库，新人上手周期大幅缩短。',
  metrics: [{
    value: '-52%',
    label: '培训周期'
  }, {
    value: '3.1×',
    label: '检索效率'
  }],
  tags: ['知识库', '提效']
}, {
  id: 'ret',
  cat: '零售',
  industry: '零售 · 营销',
  status: '6 周 · 已交付',
  title: '营销内容生成工作流',
  summary: '从选题到合规审校的端到端内容流水线。',
  metrics: [{
    value: '5×',
    label: '产出速度'
  }, {
    value: '+22%',
    label: '转化率'
  }],
  tags: ['内容', '工作流']
}, {
  id: 'fin2',
  cat: '金融',
  industry: '金融 · 投研',
  status: '10 周 · 规模化',
  title: '研报智能摘要平台',
  summary: '海量研报结构化摘要，辅助投研快速决策。',
  metrics: [{
    value: '70%',
    label: '阅读耗时↓'
  }, {
    value: '4.5×',
    label: '覆盖广度'
  }],
  tags: ['投研', 'RAG']
}];
function Cases() {
  const {
    Eyebrow,
    Tabs,
    CaseCard
  } = DS2;
  const [f, setF] = React.useState('all');
  const list = f === 'all' ? CASES : CASES.filter(c => c.cat === {
    fin: '金融',
    mfg: '制造',
    ret: '零售'
  }[f]);
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-sunken)',
      borderTop: '1px solid var(--border-subtle)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: '0 auto',
      padding: '88px 32px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u5B9E\u6218\u6848\u4F8B \xB7 Case Library"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
      margin: '16px 0 28px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 40,
      letterSpacing: '-.022em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, "\u8DE8\u884C\u4E1A\u7684\u53EF\u590D\u7528\u65B9\u6CD5"), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 320
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: f,
    onChange: setF,
    items: [{
      id: 'all',
      label: '全部',
      badge: CASES.length
    }, {
      id: 'fin',
      label: '金融'
    }, {
      id: 'mfg',
      label: '制造'
    }, {
      id: 'ret',
      label: '零售'
    }]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
      gap: 22
    }
  }, list.map(c => /*#__PURE__*/React.createElement(CaseCard, {
    key: c.id,
    industry: c.industry,
    status: c.status,
    title: c.title,
    summary: c.summary,
    metrics: c.metrics,
    tags: c.tags
  })))));
}
function Footer({
  onBook
}) {
  const {
    Button
  } = DS2;
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--grad-dark)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: -120,
      bottom: -200,
      width: 560,
      height: 760,
      background: 'var(--grad-wing)',
      opacity: .14,
      transform: 'rotate(-12deg)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: '0 auto',
      padding: '76px 32px',
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 44,
      letterSpacing: '-.025em',
      color: '#fff',
      margin: 0,
      lineHeight: 1.1
    }
  }, "\u4E3A\u56E2\u961F\u8BBE\u8BA1", /*#__PURE__*/React.createElement("br", null), "\u4E00\u6761 AI \u843D\u5730\u8DEF\u5F84"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: 'rgba(255,255,255,.78)',
      marginTop: 18,
      maxWidth: 440
    }
  }, "\u9884\u7EA6 60 \u5206\u949F\u8BCA\u65AD\uFF0C\u6211\u4EEC\u4E00\u8D77\u68B3\u7406\u4F60\u7684\u9AD8\u4EF7\u503C\u573A\u666F\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onBook,
    iconRight: "\u2192"
  }, "\u9884\u7EA6\u5185\u8BAD\u8BCA\u65AD"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      opacity: .9
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-appicon.png",
    alt: "",
    style: {
      height: 30,
      borderRadius: 8
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 16
    }
  }, "BenYan", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--emerald-400)'
    }
  }, " AI")))));
}
window.WebKitParts2 = {
  Courses,
  Cases,
  Footer
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Parts2.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Metric = __ds_scope.Metric;

__ds_ns.ProgressSteps = __ds_scope.ProgressSteps;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CaseCard = __ds_scope.CaseCard;

})();
