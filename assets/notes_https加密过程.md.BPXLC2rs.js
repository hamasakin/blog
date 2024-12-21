import{_ as t,c as a,o as e,a4 as h}from"./chunks/framework.Bn8BcnVb.js";const m=JSON.parse('{"title":"https加密过程","description":"","frontmatter":{"title":"https加密过程"},"headers":[],"relativePath":"notes/https加密过程.md","filePath":"notes/https加密过程.md"}'),l={name:"notes/https加密过程.md"},i=h('<h1 id="https加密过程" tabindex="-1">https加密过程 <a class="header-anchor" href="#https加密过程" aria-label="Permalink to &quot;https加密过程&quot;">​</a></h1><h2 id="http的不安全性" tabindex="-1">http的不安全性 <a class="header-anchor" href="#http的不安全性" aria-label="Permalink to &quot;http的不安全性&quot;">​</a></h2><p>http使用明文传输，缺少加密方案，容易被中间人攻击泄密，也无法保证数据完整性。</p><h2 id="https下的加密传输" tabindex="-1">https下的加密传输 <a class="header-anchor" href="#https下的加密传输" aria-label="Permalink to &quot;https下的加密传输&quot;">​</a></h2><p>https在http基础上提供了TLS层协议加密传输数据</p><ul><li>非对称加密<br> 使用一对公钥和私钥，一般使用公钥加密，私钥解密。https建立连接时首先生成一对密钥，服务端使用私钥，客户端使用公钥，双方首先使用这套密钥加密传送会话密钥，后续数据传输都使用会话密钥来加解密。</li><li>对称加密<br> 使用同一个会话密钥加密传输内容，加解密更快</li></ul><h2 id="中间人攻击" tabindex="-1">中间人攻击 <a class="header-anchor" href="#中间人攻击" aria-label="Permalink to &quot;中间人攻击&quot;">​</a></h2><p>使用非对称加密依然可能被中间人攻击，大致流程：</p><ol><li>客户端向服务端发起http请求，建立连接</li><li>中间人拦截请求，冒充服务端与客户端生成会话密钥并建立连接</li><li>此时中间人可以直接截取客户端数据，冒充客户端与服务端连接，造成数据泄密</li></ol><h2 id="ca数字证书" tabindex="-1">CA数字证书 <a class="header-anchor" href="#ca数字证书" aria-label="Permalink to &quot;CA数字证书&quot;">​</a></h2><p>既然会话可能被拦截，那么现在的重点就是为客户端提供一种有效的服务端身份验证系统，这就是TLS协议，可以为每个网站提供一份安全的数字证书身份。</p><ol><li>首先服务端提供公钥和网站信息给CA机构。</li><li>CA机构拿到信息后，使用hash摘要讲它们生成为哈希字符串，这是为了压缩信息，提高加解密速度和传输效率。</li><li>得到信息摘要后，下一步是使用CA本身的私钥对信息摘要进行加密，生成数字签名，将数字签名放入数字证书。这就是服务端最终得到的完整的证书，包含数字签名和网站的信息摘要。</li><li>回到客户端和服务端建立连接，服务端会首先把数字证书给客户端，客户端可以通过内置的数字证书链获取到CA机构的公钥，使用公钥对数字签名进行解密，得到解密后的信息摘要和证书内容进行对比。如果一致，则证书有效，否则无效。</li><li>证书如果有效，就可以安全的拿到证书中的公钥与服务端建立会话密钥，进行后续数据传输。 因为数字签名的存在，即使请求被中间人拦截，因为中间人没有CA的私钥，无法修改数字签名，只能修改证书内容，但是修改证书内容会导致解密后验证不一致，因此导致证书无效。</li></ol>',12),s=[i];function o(r,p,n,c,_,d){return e(),a("div",null,s)}const f=t(l,[["render",o]]);export{m as __pageData,f as default};
