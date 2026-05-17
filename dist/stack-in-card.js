!function(){const t={DEBUG:!1,BUILD_TIME:"17/05/2026, 15:57"};try{if(process)return process.env=Object.assign({},process.env),void Object.assign(process.env,t)}catch(t){}globalThis.process={env:t}}();var t="2.0.0";function e(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const i=globalThis,s=i.ShadowRoot&&(void 0===i.ShadyCSS||i.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),r=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(i,t,o)},l=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,o))(e)})(t):t,{is:c,defineProperty:d,getOwnPropertyDescriptor:h,getOwnPropertyNames:p,getOwnPropertySymbols:u,getPrototypeOf:_}=Object,f=globalThis,g=f.trustedTypes,m=g?g.emptyScript:"",y=f.reactiveElementPolyfillSupport,b=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},$=(t,e)=>!c(t,e),C={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),f.litPropertyMetadata??=new WeakMap;let A=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=C){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&d(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:o}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);o?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??C}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const t=_(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const t=this.properties,e=[...p(t),...u(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(l(t))}else void 0!==t&&e.push(l(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(s)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of e){const e=document.createElement("style"),o=i.litNonce;void 0!==o&&e.setAttribute("nonce",o),e.textContent=s.cssText,t.appendChild(e)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=s;const r=o.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,o){if(void 0!==t){const r=this.constructor;if(!1===s&&(o=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??$)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};A.elementStyles=[],A.shadowRootOptions={mode:"open"},A[b("elementProperties")]=new Map,A[b("finalized")]=new Map,y?.({ReactiveElement:A}),(f.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,k=t=>t,w=x.trustedTypes,S=w?w.createPolicy("lit-html",{createHTML:t=>t}):void 0,E="$lit$",H=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+H,P=`<${M}>`,V=document,T=()=>V.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,L=Array.isArray,R="[ \t\n\f\r]",z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,U=/>/g,D=RegExp(`>|${R}(?:([^\\s"'>=/]+)(${R}*=${R}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,I=/"/g,B=/^(?:script|style|textarea|title)$/i,q=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),G=Symbol.for("lit-noChange"),Z=Symbol.for("lit-nothing"),F=new WeakMap,K=V.createTreeWalker(V,129);function J(t,e){if(!L(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const W=(t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=z;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,d=0;for(;d<i.length&&(n.lastIndex=d,l=n.exec(i),null!==l);)d=n.lastIndex,n===z?"!--"===l[1]?n=N:void 0!==l[1]?n=U:void 0!==l[2]?(B.test(l[2])&&(o=RegExp("</"+l[2],"g")),n=D):void 0!==l[3]&&(n=D):n===D?">"===l[0]?(n=o??z,c=-1):void 0===l[1]?c=-2:(c=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?D:'"'===l[3]?I:j):n===I||n===j?n=D:n===N||n===U?n=z:(n=D,o=void 0);const h=n===D&&t[e+1].startsWith("/>")?" ":"";r+=n===z?i+P:c>=0?(s.push(a),i.slice(0,c)+E+i.slice(c)+H+h):i+H+(-2===c?e:h)}return[J(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Y{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,r=0;const n=t.length-1,a=this.parts,[l,c]=W(t,e);if(this.el=Y.createElement(l,i),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=K.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(E)){const e=c[r++],i=s.getAttribute(t).split(H),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?it:"?"===n[1]?st:"@"===n[1]?ot:et}),s.removeAttribute(t)}else t.startsWith(H)&&(a.push({type:6,index:o}),s.removeAttribute(t));if(B.test(s.tagName)){const t=s.textContent.split(H),e=t.length-1;if(e>0){s.textContent=w?w.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),K.nextNode(),a.push({type:2,index:++o});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===M)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(H,t+1));)a.push({type:7,index:o}),t+=H.length-1}o++}}static createElement(t,e){const i=V.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===G)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=O(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=Q(t,o._$AS(t,e.values),o,s)),e}class X{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??V).importNode(e,!0);K.currentNode=s;let o=K.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new tt(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new rt(o,this,t)),this._$AV.push(e),a=i[++n]}r!==a?.index&&(o=K.nextNode(),r++)}return K.currentNode=V,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=Z,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),O(t)?t===Z||null==t||""===t?(this._$AH!==Z&&this._$AR(),this._$AH=Z):t!==this._$AH&&t!==G&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>L(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Z&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(V.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Y.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new X(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new Y(t)),e}k(t){L(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new tt(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=Z,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Z}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=Q(this,t,e,0),r=!O(t)||t!==this._$AH&&t!==G,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=Q(this,s[i+n],e,n),a===G&&(a=this._$AH[n]),r||=!O(a)||a!==this._$AH[n],a===Z?t=Z:t!==Z&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===Z?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===Z?void 0:t}}class st extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==Z)}}class ot extends et{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??Z)===G)return;const i=this._$AH,s=t===Z&&i!==Z||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==Z&&(i===Z||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const nt=x.litHtmlPolyfillSupport;nt?.(Y,tt),(x.litHtmlVersions??=[]).push("3.3.3");const at=globalThis;let lt=class extends A{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=i?.renderBefore??null;s._$litPart$=o=new tt(e.insertBefore(T(),t),t,void 0,i??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}};lt._$litElement$=!0,lt.finalized=!0,at.litElementHydrateSupport?.({LitElement:lt});const ct=at.litElementPolyfillSupport;ct?.({LitElement:lt}),(at.litElementVersions??=[]).push("4.2.2");const dt={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:$},ht=(t=dt,e,i)=>{const{kind:s,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,o,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];e.call(this,i),this.requestUpdate(s,o,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return function(t){return(e,i)=>"object"==typeof i?ht(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}({...t,state:!0,attribute:!1})}const ut=t=>t??Z;let _t;async function ft(t,e){const i=(await function(){if(!_t){const t=window;_t="function"==typeof t.loadCardHelpers?t.loadCardHelpers():Promise.reject(new Error("loadCardHelpers is not available"))}return _t}()).createCardElement(t);return e&&(i.hass=e),i}function gt(t){return"function"==typeof t.getCardSize?t.getCardSize():customElements.get(t.localName)?1:customElements.whenDefined(t.localName).then(()=>gt(t))}function mt(t){return JSON.parse(JSON.stringify(t))}const yt=["styles"];function bt(t){const e={...t};for(const t of yt)delete e[t];return e}function vt(t,e){const i=t=>{t&&(t.shadowRoot&&(e(t.shadowRoot),t.shadowRoot.querySelectorAll("*").forEach(t=>i(t))),t.children&&Array.from(t.children).forEach(t=>i(t)))};e(t),i(t)}let $t=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const Ct={},At=(t=>(...e)=>({_$litDirective$:t,values:e}))(class extends $t{constructor(){super(...arguments),this.key=Z}render(t,e){return this.key=t,e}update(t,[e,i]){return e!==this.key&&(((t,e=Ct)=>{t._$AH=e})(t),this.key=e),i}});var xt=a`:host {
  --sic-default-gap: 8px;
}

.card-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-config ha-form {
  display: block;
}

.section-label {
  font-size: 12px;
  font-size: var(--ha-font-size-s, 12px);
  font-weight: 500;
  color: var(--secondary-text-color);
  margin: 12px 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.styles-hint {
  font-size: 12px;
  font-size: var(--ha-font-size-s, 12px);
  color: var(--secondary-text-color);
  margin: 4px 0 8px;
}

.styles-hint code {
  font-family: monospace;
  font-family: var(--code-font-family, monospace);
  background: var(--secondary-background-color);
  padding: 1px 4px;
  border-radius: 3px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 8px 12px;
}

.styles-editor {
  border: 1px solid #e0e0e0;
  border: 1px solid var(--divider-color, #e0e0e0);
  border-radius: 6px;
  overflow: hidden;
  background: var(--code-editor-background-color, var(--card-background-color));
  min-height: 90px;
  display: flex;
  flex-direction: column;
}

.styles-editor ha-code-editor {
  display: block;
  flex: 1;
  --code-mirror-max-height: 360px;
}

/* ----------------------------- Tab bar -------------------------------- */

/* Row that holds the native ha-tab-group (or fallback) plus the add button */
.tabs-row {
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid #e0e0e0;
  border-bottom: 1px solid var(--divider-color, #e0e0e0);
  margin-bottom: 8px;
}

.tabs {
  flex: 1;
  min-width: 0;
  --ha-tab-track-color: var(--card-background-color);
}

.tabs__add {
  flex: 0 0 auto;
}

/* --- Fallback button-based tabs (used when ha-tab-group isn't defined) --- */

.tab-bar--fallback {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0;
}

.tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 32px;
  padding: 0 10px;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
  border: 1px solid var(--divider-color, #e0e0e0);
  background: var(--secondary-background-color);
  color: var(--secondary-text-color);
  cursor: pointer;
  font-size: 14px;
  font-size: var(--ha-font-size-m, 14px);
  font-weight: 500;
  transition: background-color 150ms ease, color 150ms ease, transform 100ms ease;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}

.tab:hover {
  color: var(--primary-text-color);
}

.tab:active {
  transform: scale(0.95);
}

.tab:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.tab--active {
  background: var(--primary-color);
  color: #fff;
  color: var(--text-primary-color, #fff);
  border-color: var(--primary-color);
}

/* ----------------------------- Child actions row ---------------------- */

.child-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0 8px;
}

.child-actions__spacer {
  flex: 1;
}

.child-actions ha-icon-button[disabled] {
  opacity: 0.4;
  pointer-events: none;
}

/* ----------------------------- Child editor host ---------------------- */

.child-editor {
  border: 1px solid #e0e0e0;
  border: 1px solid var(--divider-color, #e0e0e0);
  border-radius: 8px;
  padding: 8px;
  background: var(--card-background-color);
}

hui-card-element-editor {
  display: block;
}

/* ----------------------------- Embedded card picker ------------------- */

.picker-wrapper {
  border: 1px solid #e0e0e0;
  border: 1px solid var(--divider-color, #e0e0e0);
  border-radius: 8px;
  padding: 8px;
  background: var(--card-background-color);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px;
  font-weight: 500;
  color: var(--primary-text-color);
  border-bottom: 1px solid #e0e0e0;
  border-bottom: 1px solid var(--divider-color, #e0e0e0);
  margin-bottom: 8px;
}

hui-card-picker {
  display: block;
}

.paste-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px dashed #e0e0e0;
  border: 1px dashed var(--divider-color, #e0e0e0);
  border-radius: 8px;
  background: var(--secondary-background-color);
  color: var(--primary-text-color);
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.paste-entry:hover {
  background: var(--card-background-color);
  border-color: var(--primary-color);
  border-style: solid;
}

.paste-entry:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.paste-entry__icon {
  --mdc-icon-size: 24px;
  color: var(--primary-color);
  flex: 0 0 auto;
}

.paste-entry__text {
  flex: 1;
  min-width: 0;
}

.paste-entry__title {
  font-weight: 500;
  margin-bottom: 2px;
}

.paste-entry__sub {
  font-size: 12px;
  font-size: var(--ha-font-size-s, 12px);
  color: var(--secondary-text-color);
}

/* ----------------------------- Loading placeholder -------------------- */

.styles-editor--loading {
  align-items: center;
  justify-content: center;
  color: var(--secondary-text-color);
  font-size: 12px;
  font-size: var(--ha-font-size-s, 12px);
  font-style: italic;
}

/* ----------------------------- Footer --------------------------------- */

.editor-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0 4px;
  flex-wrap: wrap;
  border-top: 1px solid #e0e0e0;
  border-top: 1px solid var(--divider-color, #e0e0e0);
  margin-top: 8px;
}

.editor-footer__hint {
  font-size: 12px;
  font-size: var(--ha-font-size-s, 12px);
  color: var(--secondary-text-color);
}

.editor-footer__version {
  font-size: 12px;
  font-size: var(--ha-font-size-s, 12px);
  color: var(--disabled-text-color);
  margin-left: auto;
}

ha-expansion-panel {
  --expansion-panel-summary-padding: 0 12px;
  --expansion-panel-content-padding: 0 8px;
}
`;!function(t,e){void 0===e&&(e={});var i=e.insertAt;if(t&&"undefined"!=typeof document){var s=document.head||document.getElementsByTagName("head")[0],o=document.createElement("style");o.type="text/css","top"===i&&s.firstChild?s.insertBefore(o,s.firstChild):s.appendChild(o),o.styleSheet?o.styleSheet.cssText=t:o.appendChild(document.createTextNode(t))}}(xt);const kt="dashboardCardClipboard",wt=process.env.BUILD_TIME,St=[{name:"title",selector:{text:{}}},{name:"mode",selector:{select:{mode:"dropdown",options:[{value:"vertical",label:"Vertical"},{value:"horizontal",label:"Horizontal"}]}}},{type:"expandable",title:"Keep options",schema:[{type:"grid",column_min_width:"160px",schema:[{name:"keep.background",selector:{boolean:{}}},{name:"keep.box_shadow",selector:{boolean:{}}},{name:"keep.border_radius",selector:{boolean:{}}},{name:"keep.margin",selector:{boolean:{}}},{name:"keep.outer_padding",selector:{boolean:{}}}]}]}],Et={title:"Title (optional header)",mode:"Stack mode","keep.background":"Keep background","keep.box_shadow":"Keep box-shadow","keep.border_radius":"Keep border-radius","keep.margin":"Keep margin between cards","keep.outer_padding":"Keep outer padding (8px) when margin is kept"};function Ht(t,e,i){const s=e.split(".");let o=t;for(;s.length-1;){const t=s.shift();Object.prototype.hasOwnProperty.call(o,t)&&"object"==typeof o[t]&&null!==o[t]||(o[t]={}),o=o[t]}o[s[0]]=i}function Mt(t,e){const i=e.split(".");let s=t;for(;i.length>1;){const t=i.shift();if(!s[t])return;s=s[t]}delete s[i[0]]}class Pt extends lt{constructor(){super(...arguments),this._selectedChild=0,this._childGuiMode=!0,this._showPicker=!1,this._keys=new Map,this._valueChanged=t=>{if(!this._config)return;const e=t.detail.value,i=this._applyFormChange(e);this._fireConfigChanged(i)},this._computeLabel=t=>Et[t.name]??t.name,this._motherStyleChanged=t=>{if(!this._config)return;t.stopPropagation();const e=(t.detail?.value??"").trim(),i=mt(this._config);e?i.styles=e:delete i.styles,this._fireConfigChanged(i)},this._selectedChildStyleChanged=t=>{if(!this._config||null===this._selectedChild)return;t.stopPropagation();const e=(t.detail?.value??"").trim(),i=this._selectedChild,s=(this._config.cards??[]).slice();if(!s[i])return;const o={...s[i]};e?o.styles=e:delete o.styles,s[i]=o;const r=mt(this._config);r.cards=s,this._fireConfigChanged(r)},this._onTabShow=t=>{const e=t.detail?.name;if(null==e)return;const i=parseInt(e,10);Number.isNaN(i)||(this._selectedChild=i)},this._handleMove=t=>{if(!this._config||null===this._selectedChild)return;const e=t.currentTarget.move,i=this._selectedChild,s=i+e,o=[...this._config.cards??[]];if(s<0||s>=o.length)return;const r=o.splice(i,1)[0];o.splice(s,0,r),this._config={...this._config,cards:o},this._selectedChild=s,this._keys.clear(),this._fireConfigChanged(this._config)},this._handleDelete=()=>{null!==this._selectedChild&&this._deleteChild(this._selectedChild)},this._copyChild=()=>{if(!this._config||null===this._selectedChild)return;const t=this._config.cards?.[this._selectedChild];if(t)try{sessionStorage.setItem(kt,JSON.stringify(t))}catch{}},this._cutChild=()=>{this._config&&null!==this._selectedChild&&(this._copyChild(),this._deleteChild(this._selectedChild))},this._addChild=()=>{this._clipboardCard=this._readClipboard(),this._showPicker=!0},this._cancelAddChild=()=>{this._showPicker=!1},this._handlePasteClipboard=()=>{const t=this._readClipboard();t&&this._appendCard(t)},this._handleCardPicked=t=>{t.stopPropagation();const e=t.detail?.config;e&&this._appendCard(e)},this._childCardConfigChanged=t=>{if(!this._config||null===this._selectedChild)return;t.stopPropagation();const e=t.detail?.config;if(!e)return;const i=this._selectedChild,s=this._config.cards?.[i],o={...e};if(s?.styles&&(o.styles=s.styles),s&&JSON.stringify(s)===JSON.stringify(o))return;const r=(this._config.cards??[]).slice();r[i]=o;const n=mt(this._config);n.cards=r,this._fireConfigChanged(n)}}_getKey(t,e){const i=`${e}-${t.length}`;return this._keys.has(i)||this._keys.set(i,Math.random().toString()),this._keys.get(i)}static get styles(){return xt}setConfig(t){this._config=t||{};const e=this._config.cards??[];0===e.length?(this._selectedChild=null,this._clipboardCard=this._readClipboard()):null===this._selectedChild?this._selectedChild=0:this._selectedChild>=e.length&&(this._selectedChild=e.length-1)}_buildFormData(){const t=this._config??{};return{title:t.title??"",mode:t.mode??"vertical","keep.background":!!t.keep?.background,"keep.box_shadow":!!t.keep?.box_shadow,"keep.border_radius":!!t.keep?.border_radius,"keep.margin":!!t.keep?.margin,"keep.outer_padding":t.keep?.outer_padding??!!t.keep?.margin}}_applyFormChange(t){const e=mt(this._config);t.title?e.title=t.title:delete e.title,t.mode&&"vertical"!==t.mode?e.mode=t.mode:delete e.mode;const i=["keep.background","keep.box_shadow","keep.border_radius","keep.margin","keep.outer_padding"];for(const s of i)t[s]?Ht(e,s,!0):Mt(e,s);return e.keep&&0===Object.keys(e.keep).length&&delete e.keep,e}_selectChild(t){this._selectedChild=t}get _hasNativeTabs(){return!!customElements.get("ha-tab-group")&&!!customElements.get("ha-tab-group-tab")}get _hasArrowButtons(){return!!customElements.get("ha-icon-button-arrow-prev")&&!!customElements.get("ha-icon-button-arrow-next")}_deleteChild(t){if(!this._config)return;const e=[...this._config.cards??[]];t<0||t>=e.length||(e.splice(t,1),this._config={...this._config,cards:e},this._selectedChild=0===e.length?null:Math.min(t,e.length-1),this._keys.clear(),this._fireConfigChanged(this._config))}_readClipboard(){try{const t=sessionStorage.getItem(kt);if(!t)return;const e=JSON.parse(t);if(e&&"object"==typeof e&&"string"==typeof e.type)return e}catch{}}_appendCard(t){if(!this._config)return;const e=[...this._config.cards??[],t];this._config={...this._config,cards:e},this._selectedChild=e.length-1,this._keys.clear(),this._fireConfigChanged(this._config),requestAnimationFrame(()=>{this._showPicker=!1})}_toggleChildEditorMode(){this._childGuiMode=!this._childGuiMode}_fireConfigChanged(t){!function(t,e,i={},s={}){const o=new Event(e,{bubbles:s.bubbles??!0,cancelable:Boolean(s.cancelable),composed:s.composed??!0});o.detail=i,t.dispatchEvent(o)}(this,"config-changed",{config:t})}_openLink(){window.open("https://github.com/duczz/ha-stack-in-card/blob/master/README.md","_blank","noopener")}_renderCardPicker(t){return q`
      <div class="picker-wrapper">
        ${t?q`
              <div class="picker-header">
                <span>Pick a card to add</span>
                <ha-icon-button
                  .label=${"Cancel"}
                  .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}
                  @click=${this._cancelAddChild}
                ></ha-icon-button>
              </div>
            `:Z}
        ${this._clipboardCard?q`
              <button
                class="paste-entry"
                @click=${this._handlePasteClipboard}
                type="button"
              >
                <ha-svg-icon
                  class="paste-entry__icon"
                  .path=${"M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0C10.7,0 9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z"}
                ></ha-svg-icon>
                <div class="paste-entry__text">
                  <div class="paste-entry__title">
                    ${this.hass.localize?.("ui.panel.lovelace.editor.card.generic.paste")??"Paste from clipboard"}
                  </div>
                  <div class="paste-entry__sub">
                    ${this.hass.localize?.("ui.panel.lovelace.editor.card.generic.paste_description",{type:this._clipboardCard.type})??this._clipboardCard.type}
                  </div>
                </div>
              </button>
            `:Z}
        <hui-card-picker
          .hass=${this.hass}
          .lovelace=${this.lovelace}
          @config-changed=${this._handleCardPicked}
        ></hui-card-picker>
      </div>
    `}render(){if(!this.hass||!this._config)return q``;const e=this._buildFormData(),i=this._config.styles??"",s=this._config.cards??[],o=this._selectedChild,r=null!==o&&o>=0&&o<s.length?s[o]:void 0,n=r?.styles??"",a=r?bt(r):void 0;return q`
      <div class="card-config">
        <ha-form
          .hass=${this.hass}
          .data=${e}
          .schema=${St}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>

        <ha-expansion-panel .header=${"Custom CSS — Stack card"} outlined>
          <div class="panel-content">
            <p class="styles-hint">
              CSS applied to the outer stack card itself. Target the wrapper with
              <code>ha-card</code>.
            </p>
            <div class="styles-editor">
              <ha-code-editor
                mode="yaml"
                autocomplete-entities
                autocomplete-icons
                .hass=${this.hass}
                .value=${i}
                @value-changed=${this._motherStyleChanged}
              ></ha-code-editor>
            </div>
          </div>
        </ha-expansion-panel>

        <div class="section-label">Cards</div>

        <div class="tabs-row">
          ${this._hasNativeTabs?q`
                <ha-tab-group class="tabs" @wa-tab-show=${this._onTabShow}>
                  ${s.map((t,e)=>q`
                      <ha-tab-group-tab
                        slot="nav"
                        .panel=${e}
                        .active=${e===o}
                      >
                        ${e+1}
                      </ha-tab-group-tab>
                    `)}
                </ha-tab-group>
              `:q`
                <!-- Fallback for HA versions without ha-tab-group -->
                <div class="tab-bar tab-bar--fallback" role="tablist">
                  ${s.map((t,e)=>q`
                      <button
                        class=${"tab "+(o===e?"tab--active":"")}
                        role="tab"
                        aria-selected=${o===e?"true":"false"}
                        @click=${()=>this._selectChild(e)}
                      >
                        ${e+1}
                      </button>
                    `)}
                </div>
              `}
          <ha-icon-button
            class="tabs__add"
            .label=${"Add card"}
            .path=${"M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"}
            @click=${this._addChild}
          ></ha-icon-button>
        </div>

        ${this._showPicker?this._renderCardPicker(!0):r?q`
                <div id="card-options" class="child-actions">
                  <!-- GUI/YAML toggle (HA's order: this comes first) -->
                  <ha-icon-button
                    .label=${this._childGuiMode?this.hass.localize?.("ui.panel.lovelace.editor.edit_card.show_code_editor")??"Show code editor":this.hass.localize?.("ui.panel.lovelace.editor.edit_card.show_visual_editor")??"Show visual editor"}
                    .path=${this._childGuiMode?"M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z":"M11 15H17V17H11V15M9 7H7V9H9V7M11 13H17V11H11V13M11 9H17V7H11V9M9 11H7V13H9V11M21 5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5M19 5H5V19H19V5M9 15H7V17H9V15Z"}
                    @click=${this._toggleChildEditorMode}
                  ></ha-icon-button>

                  <!-- Move before (RTL-aware native arrow) -->
                  ${this._hasArrowButtons?q`<ha-icon-button-arrow-prev
                        .hass=${this.hass}
                        .label=${this.hass.localize?.("ui.panel.lovelace.editor.edit_card.move_before")??"Move before"}
                        .disabled=${0===o}
                        .move=${-1}
                        @click=${this._handleMove}
                      ></ha-icon-button-arrow-prev>`:q`<ha-icon-button
                        .label=${"Move before"}
                        .path=${"M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"}
                        .disabled=${0===o}
                        .move=${-1}
                        @click=${this._handleMove}
                      ></ha-icon-button>`}

                  <!-- Move after -->
                  ${this._hasArrowButtons?q`<ha-icon-button-arrow-next
                        .hass=${this.hass}
                        .label=${this.hass.localize?.("ui.panel.lovelace.editor.edit_card.move_after")??"Move after"}
                        .disabled=${o===s.length-1}
                        .move=${1}
                        @click=${this._handleMove}
                      ></ha-icon-button-arrow-next>`:q`<ha-icon-button
                        .label=${"Move after"}
                        .path=${"M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"}
                        .disabled=${o===s.length-1}
                        .move=${1}
                        @click=${this._handleMove}
                      ></ha-icon-button>`}

                  <!-- Copy -->
                  <ha-icon-button
                    .label=${this.hass.localize?.("ui.panel.lovelace.editor.edit_card.copy")??"Copy"}
                    .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}
                    @click=${this._copyChild}
                  ></ha-icon-button>

                  <!-- Cut -->
                  <ha-icon-button
                    .label=${this.hass.localize?.("ui.panel.lovelace.editor.edit_card.cut")??"Cut"}
                    .path=${"M19,3L13,9L15,11L22,4V3M12,12.5A0.5,0.5 0 0,1 11.5,12A0.5,0.5 0 0,1 12,11.5A0.5,0.5 0 0,1 12.5,12A0.5,0.5 0 0,1 12,12.5M6,20A2,2 0 0,1 4,18C4,16.89 4.9,16 6,16A2,2 0 0,1 8,18C8,19.11 7.1,20 6,20M6,8A2,2 0 0,1 4,6C4,4.89 4.9,4 6,4A2,2 0 0,1 8,6C8,7.11 7.1,8 6,8M9.64,7.64C9.87,7.14 10,6.59 10,6A4,4 0 0,0 6,2A4,4 0 0,0 2,6A4,4 0 0,0 6,10C6.59,10 7.14,9.87 7.64,9.64L10,12L7.64,14.36C7.14,14.13 6.59,14 6,14A4,4 0 0,0 2,18A4,4 0 0,0 6,22A4,4 0 0,0 10,18C10,17.41 9.87,16.86 9.64,16.36L12,14L19,21H22V20L9.64,7.64Z"}
                    @click=${this._cutChild}
                  ></ha-icon-button>

                  <!-- Delete -->
                  <ha-icon-button
                    .label=${this.hass.localize?.("ui.panel.lovelace.editor.edit_card.delete")??"Delete"}
                    .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                    @click=${this._handleDelete}
                  ></ha-icon-button>
                </div>

                <div class="child-editor">
                  ${At(this._getKey(s,o),q`<hui-card-element-editor
                      .hass=${this.hass}
                      .value=${a}
                      .lovelace=${this.lovelace}
                      .GUImode=${this._childGuiMode}
                      @config-changed=${this._childCardConfigChanged}
                      @GUImode-changed=${t=>{this._childGuiMode=!!t.detail?.guiMode}}
                    ></hui-card-element-editor>`)}
                </div>

                <div class="section-label">Custom CSS — Card ${o+1}</div>
                <p class="styles-hint">
                  CSS injected into this child card's shadow DOM. Doesn't affect sibling cards.
                </p>
                <div class="styles-editor">
                  <ha-code-editor
                    mode="yaml"
                    autocomplete-entities
                    autocomplete-icons
                    .hass=${this.hass}
                    .value=${n}
                    @value-changed=${this._selectedChildStyleChanged}
                  ></ha-code-editor>
                </div>
              `:this._renderCardPicker(!1)}

        <div class="editor-footer">
          <ha-button @click=${this._openLink}>
            <ha-svg-icon .path=${"M12 21.5C10.65 20.65 8.2 20 6.5 20C4.85 20 3.15 20.3 1.75 21.05C1.65 21.1 1.6 21.1 1.5 21.1C1.25 21.1 1 20.85 1 20.6V6C1.6 5.55 2.25 5.25 3 5C4.11 4.65 5.33 4.5 6.5 4.5C8.45 4.5 10.55 4.9 12 6C13.45 4.9 15.55 4.5 17.5 4.5C18.67 4.5 19.89 4.65 21 5C21.75 5.25 22.4 5.55 23 6V20.6C23 20.85 22.75 21.1 22.5 21.1C22.4 21.1 22.35 21.1 22.25 21.05C20.85 20.3 19.15 20 17.5 20C15.8 20 13.35 20.65 12 21.5M12 8V19.5C13.35 18.65 15.8 18 17.5 18C18.7 18 19.9 18.15 21 18.5V7C19.9 6.65 18.7 6.5 17.5 6.5C15.8 6.5 13.35 7.15 12 8M13 11.5C14.11 10.82 15.6 10.5 17.5 10.5C18.41 10.5 19.26 10.59 20 10.78V9.23C19.13 9.08 18.29 9 17.5 9C15.73 9 14.23 9.28 13 9.84V11.5M17.5 11.67C15.79 11.67 14.29 11.93 13 12.46V14.15C14.11 13.5 15.6 13.16 17.5 13.16C18.54 13.16 19.38 13.24 20 13.4V11.9C19.13 11.74 18.29 11.67 17.5 11.67M20 14.57C19.13 14.41 18.29 14.33 17.5 14.33C15.67 14.33 14.17 14.6 13 15.13V16.82C14.11 16.16 15.6 15.83 17.5 15.83C18.54 15.83 19.38 15.91 20 16.07V14.57Z"} slot="icon"></ha-svg-icon>
            Documentation
          </ha-button>
          <span class="editor-footer__version">v${t} · ${wt}</span>
        </div>
      </div>
    `}}e([pt()],Pt.prototype,"_config",void 0),e([pt()],Pt.prototype,"hass",void 0),e([pt()],Pt.prototype,"lovelace",void 0),e([pt()],Pt.prototype,"_selectedChild",void 0),e([pt()],Pt.prototype,"_childGuiMode",void 0),e([pt()],Pt.prototype,"_showPicker",void 0),e([pt()],Pt.prototype,"_clipboardCard",void 0),customElements.get("stack-in-card-editor")||customElements.define("stack-in-card-editor",Pt);const Vt="stack-in-card-child-style",Tt="stack-in-card-mother-style";class Ot extends lt{constructor(){super(...arguments),this._styleApplyRafHandle=null,this._styleApplyTimeoutHandle=null,this._stackGeneration=0}static get styles(){return a`
      :host {
        display: block;
      }
      ha-card {
        overflow: hidden;
      }
      .stack-in-card-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 28px 16px;
        color: var(--secondary-text-color);
        text-align: center;
      }
      .stack-in-card-empty__icon {
        --mdc-icon-size: 36px;
        color: var(--secondary-text-color);
        opacity: 0.7;
      }
      .stack-in-card-empty__title {
        font-weight: 500;
        color: var(--primary-text-color);
        font-size: var(--ha-font-size-l, 16px);
      }
      .stack-in-card-empty__sub {
        font-size: var(--ha-font-size-s, 13px);
      }
    `}static getConfigElement(){return document.createElement("stack-in-card-editor")}static getStubConfig(){return{mode:"vertical",cards:[]}}set hass(t){this._hass=t,this._card&&(this._card.hass=t)}get hass(){return this._hass}setConfig(t){if(!t)throw new Error("Invalid configuration");if(!Array.isArray(t.cards))throw new Error('stack-in-card: "cards" must be an array.');if(t.mode&&"vertical"!==t.mode&&"horizontal"!==t.mode)throw new Error(`Unsupported mode "${t.mode}" (must be "vertical" or "horizontal")`);this._config={mode:"vertical",...t,keep:{background:!1,margin:!1,box_shadow:!1,border_radius:!1,...t.keep??{}}},this._config.keep?.margin&&void 0===this._config.keep?.outer_padding&&(this._config.keep.outer_padding=!0),this._createStack()}disconnectedCallback(){super.disconnectedCallback(),null!==this._styleApplyRafHandle&&(cancelAnimationFrame(this._styleApplyRafHandle),this._styleApplyRafHandle=null),null!==this._styleApplyTimeoutHandle&&(clearTimeout(this._styleApplyTimeoutHandle),this._styleApplyTimeoutHandle=null),this._childObserver?.disconnect(),this._childObserver=void 0,this._cardPromise=void 0}updated(t){super.updated(t),this._card&&(t.has("_card")||t.has("_config"))&&this._scheduleStyleApplication()}_scheduleStyleApplication(t=!1){null!==this._styleApplyRafHandle&&(cancelAnimationFrame(this._styleApplyRafHandle),this._styleApplyRafHandle=null),null!==this._styleApplyTimeoutHandle&&(clearTimeout(this._styleApplyTimeoutHandle),this._styleApplyTimeoutHandle=null);const e=()=>{this._styleApplyRafHandle=requestAnimationFrame(()=>{this._styleApplyRafHandle=null,this._applyAllStyles()})};t?this._styleApplyTimeoutHandle=setTimeout(()=>{this._styleApplyTimeoutHandle=null,e()},Ot._MUTATION_DEBOUNCE_MS):e()}async _applyAllStyles(){if(!this._card)return;this._childObserver?.disconnect();const t=this._card;if(t.updateComplete&&await t.updateComplete,this._walkChildren(this._card,!1),this._injectChildStyles(),this._injectMotherStyle(),await new Promise(t=>requestAnimationFrame(()=>t())),this._walkChildren(this._card,!0),this._config?.keep?.outer_padding&&this._card?.shadowRoot){const t=this._card.shadowRoot.getElementById("root");t&&(t.style.padding="8px")}this._ensureChildObserver()}_ensureChildObserver(){if(this._childObserver||!this._card)return;const t=this._card.shadowRoot??this._card;this._childObserver=new MutationObserver(t=>{for(const e of t)if("childList"===e.type)for(let t=0;t<e.addedNodes.length;t++)if(e.addedNodes[t].nodeType===Node.ELEMENT_NODE)return void this._scheduleStyleApplication(!0)}),this._childObserver.observe(t,{childList:!0,subtree:!0})}async _createStack(){const t=++this._stackGeneration;if(this._childObserver?.disconnect(),this._childObserver=void 0,!this._config.cards||0===this._config.cards.length)return this._card=void 0,void(this._cardPromise=void 0);const e=ft({type:`${this._config.mode}-stack`,cards:this._config.cards.map(bt)},this._hass);let i;this._cardPromise=e;try{i=await e}catch(t){return void console.error("stack-in-card: failed to create stack",t)}t===this._stackGeneration&&(this._hass&&(i.hass=this._hass),this._card=i,i.addEventListener("ll-rebuild",t=>{t.stopPropagation(),this._createStack()},{once:!0}))}render(){if(!this._hass||!this._config)return Z;return 0===(this._config.cards??[]).length?q`
        <ha-card header=${ut(this._config.title)}>
          <div class="stack-in-card-empty">
            <ha-svg-icon
              class="stack-in-card-empty__icon"
              .path=${"M20 14H14V20H10V14H4V10H10V4H14V10H20V14Z"}
            ></ha-svg-icon>
            <div class="stack-in-card-empty__title">Stack In Card</div>
            <div class="stack-in-card-empty__sub">
              Add child cards from the editor.
            </div>
          </div>
        </ha-card>
      `:q`
      <ha-card header=${ut(this._config.title)}>
        <div class="stack-in-card-content">${this._card??""}</div>
      </ha-card>
    `}_walkChildren(t,e){if(!t)return;const i=t=>{if(t&&"STACK-IN-CARD"!==t.tagName)if(t.shadowRoot){const s=t.shadowRoot.querySelector("ha-card");if(s)this._applyCardStyle(s,e);else{const e=t.shadowRoot.getElementById("root")||t.shadowRoot.getElementById("card");e&&(this._stripMargin(e),e.childNodes.forEach(t=>i(t)))}}else if("function"==typeof t.querySelector){const s=t.querySelector("ha-card");s&&this._applyCardStyle(s,e),t.childNodes?.forEach(t=>i(t))}};i(t)}_stripMargin(t){t&&!this._config?.keep?.margin&&t.style&&(t.style.margin="0px")}_applyCardStyle(t,e){if(!t)return;const i=this._config?.keep??{};i.box_shadow||(t.style.boxShadow="none"),!i.background&&e&&"true"!==getComputedStyle(t).getPropertyValue("--keep-background").trim()&&(t.style.background="transparent"),i.border_radius||(t.style.borderRadius="0")}_injectMotherStyle(){if(!this.shadowRoot)return;const t=this._config?.styles?.trim();let e=this.shadowRoot.getElementById(Tt);t?(e||(e=document.createElement("style"),e.id=Tt,this.shadowRoot.appendChild(e)),e.textContent!==t&&(e.textContent=t)):e&&e.remove()}_injectChildStyles(){if(!this._card)return;const t=this._card.shadowRoot;if(!t)return;const e=this._config?.cards??[],i=t.getElementById("root");if(!i)return;Array.from(i.children).forEach((t,i)=>{const s=e[i]?.styles?.trim();this._applyChildCss(t,s,0)})}_applyChildCss(t,e,i){if(vt(t,t=>{const e=t.querySelector?.(`#${Vt}`);e?.remove()}),!e)return;let s=!1;vt(t,t=>{t instanceof ShadowRoot&&(s=!0),this._writeStyleTag(t,e)}),!s&&i<3&&setTimeout(()=>{this.isConnected&&this._applyChildCss(t,e,i+1)},200)}_writeStyleTag(t,e){let i=t.querySelector?.(`#${Vt}`);i||(i=document.createElement("style"),i.id=Vt,t.appendChild(i)),i.textContent!==e&&(i.textContent=e)}async getCardSize(){return this._cardPromise&&await this._cardPromise,this._card?gt(this._card):1}}Ot._MUTATION_DEBOUNCE_MS=150,e([pt()],Ot.prototype,"_card",void 0),e([pt()],Ot.prototype,"_config",void 0);const Lt="stack-in-card";!function(){const t=window;t.customCards=t.customCards||[],t.customCards.find(t=>t.type===Lt)||t.customCards.push({type:Lt,name:"Stack In Card",preview:!0,description:"Group multiple cards into a single seamless card — with a visual editor and per-card custom CSS.",documentationURL:"https://github.com/duczz/ha-stack-in-card"})}(),customElements.get(Lt)||(customElements.define(Lt,Ot),console.info(`%c STACK-IN-CARD %c v${t} `,"color: white; background: #6f4cff; font-weight: 700; padding: 2px 6px; border-radius: 3px 0 0 3px;","color: #6f4cff; background: #1f1f1f; font-weight: 700; padding: 2px 6px; border-radius: 0 3px 3px 0;"));
