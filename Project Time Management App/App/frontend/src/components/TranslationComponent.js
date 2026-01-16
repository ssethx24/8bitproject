import React, { useEffect, useRef } from 'react';

const TranslateComponent = () => {
  // Reference to the div where Google Translate will be embedded
  const googleTranslateElementRef = useRef(null);

  useEffect(() => {
    const initTranslate = () => {
      // Initialize Google Translate widget with specified options
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en', // Default page language
          includedLanguages: 
            'af,ar,bg,bn,ca,cs,da,de,el,en,es,et,fa,fi,fr,gu,he,hi,hr,hu,id,it,ja,kn,ko,lt,lv,ml,mr,ms,mt,nl,no,pl,pt,ro,ru,sk,sl,sv,ta,te,th,tl,tr,uk,ur,vi,zh-CN,zh-TW,aa,ab,ae,ak,am,an,as,av,ay,az,ba,be,bi,bm,bo,br,bs,ce,ch,co,cr,cu,cv,cy,dv,dz,ee,eo,eu,ff,fj,fo,fy,ga,gd,gl,gn,gv,ha,ho,ht,hy,hz,ia,ie,ig,ii,ik,io,is,iu,jv,ka,kg,ki,kj,kk,kl,km,kr,ks,ku,kv,kw,ky,la,lb,lg,li,ln,lo,lu,mh,mi,mk,mn,my,na,nb,nd,ne,ng,nn,nr,nv,ny,oc,oj,om,or,os,pa,pi,ps,qu,rm,rn,sa,sc,sd,se,sg,si,sm,sn,so,sq,sr,ss,st,su,sw,tt,tw,ty,ug,uz,ve,vo,wa,wo,xh,yi,yo,za,zu', // List of included languages
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE, // Set the widget layout to SIMPLE
        },
        googleTranslateElementRef.current // Attach the widget to the referenced div
      );
    };

    // Check if Google Translate script is already available
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      initTranslate(); // Initialize the widget immediately if the script is already loaded
    } else {
      // Assign the initialization function to the global scope for later use when the script is loaded
      window.googleTranslateElementInit = initTranslate;
    }
  }, []);

  // Return the div where the Google Translate widget will be inserted
  return <div ref={googleTranslateElementRef}></div>;
};

export default TranslateComponent;
