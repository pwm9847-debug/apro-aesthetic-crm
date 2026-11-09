/* dc-lite: 디자인 캔버스용 .dc.html 파일을 일반 웹 페이지로 열어 주는 작은 런타임.
   - <helmet> 내용을 <head>로 옮기고
   - <sc-for>, <sc-if>, {{경로}} 치환을 처리합니다. */
(function () {
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(s) { Object.assign(this.state, typeof s === 'function' ? s(this.state) : s); }
    forceUpdate() {}
    renderVals() { return {}; }
  }
  window.DCLogic = DCLogic;

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function get(scope, path) {
    path = String(path).trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    var v = scope, parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function str(v) { return v == null ? '' : String(v); }
  function interp(s, scope) {
    var w = s.match(WHOLE);
    if (w) return str(get(scope, w[1]));
    return s.replace(HOLE, function (m, p) { return str(get(scope, p)); });
  }
  function strip(s) { return String(s || '').replace(/[{}]/g, ''); }

  function proc(node, scope) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        if (n.nodeValue.indexOf('{{') > -1) n.nodeValue = interp(n.nodeValue, scope);
        return;
      }
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style') return;

      if (tag === 'sc-for') {
        var list = get(scope, strip(n.getAttribute('list'))) || [];
        var as = n.getAttribute('as') || 'item';
        var frag = document.createDocumentFragment();
        list.forEach(function (item, i) {
          var sub = Object.assign({}, scope);
          sub[as] = item; sub.$index = i;
          var holder = document.createElement('div');
          Array.prototype.forEach.call(n.childNodes, function (c) { holder.appendChild(c.cloneNode(true)); });
          proc(holder, sub);
          while (holder.firstChild) frag.appendChild(holder.firstChild);
        });
        n.replaceWith(frag);
        return;
      }
      if (tag === 'sc-if') {
        var val = get(scope, strip(n.getAttribute('value')));
        if (val) {
          proc(n, scope);
          var f = document.createDocumentFragment();
          while (n.firstChild) f.appendChild(n.firstChild);
          n.replaceWith(f);
        } else {
          n.remove();
        }
        return;
      }
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        if (a.value.indexOf('{{') > -1) n.setAttribute(a.name, interp(a.value, scope));
      });
      proc(n, scope);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var xdc = document.querySelector('x-dc');
    if (!xdc) return;
    var vals = {};
    var sc = document.querySelector('script[data-dc-script]');
    if (sc) {
      var C = new Function('DCLogic', sc.textContent + '\n;return Component;')(DCLogic);
      vals = new C({}).renderVals() || {};
    }
    var h = xdc.querySelector('helmet');
    if (h) {
      Array.prototype.slice.call(h.childNodes).forEach(function (c) {
        if (c.nodeType === 1) document.head.appendChild(c);
      });
      h.remove();
    }
    proc(xdc, vals);

    var css = document.createElement('style');
    css.textContent = 'x-dc{display:block}html,body{background:#F5F5F2}.sv{margin:0 auto}';
    document.head.appendChild(css);
    document.documentElement.setAttribute('data-dc-ready', '1');
  });
})();
