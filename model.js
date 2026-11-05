export const defaults = {mode:'personal',age:35,retire:60,end:95,stock:1000000,etf:1000000,cash:300000,invest:10000,saving:5000,partnerStock:500000,partnerEtf:500000,partnerCash:200000,partnerInvest:5000,partnerSaving:5000,share:50,living:40000,rent:0,principal:0,payment:0,mortgageMonths:120,mortgageRate:2,growth:5,return:4,inflation:2};
export function validate(v) {
  if (!['personal','family'].includes(v.mode)) throw Error('請選擇個人或家庭模式。');
  for (const key of Object.keys(defaults).filter(k=>k!=='mode')) if(typeof v[key]!=='number'||!Number.isFinite(v[key])) throw Error('請完整填寫所有數字欄位。');
  if(v.age<18||v.end>120||v.age>v.retire||v.retire>=v.end) throw Error('請確認：18 ≤ 目前年齡 ≤ 退休年齡 < 模擬終點 ≤ 120。');
  for(const key of ['age','retire','end']) if(Math.abs(v[key]*12-Math.round(v[key]*12))>0.001) throw Error('年齡請以整月為單位（例如 35.5 歲）。');
  for(const key of Object.keys(defaults).filter(k=>!['mode','growth','return'].includes(k))) if(v[key]<0||v[key]>1e12) throw Error('金額及期間不可為負數或超出範圍。');
  if(v.share>100||v.inflation>30||v.mortgageRate>30||v.growth<=-100||v.return<=-100||v.growth>50||v.return>50) throw Error('比例須為 0–100%；通膨與房貸利率為 0–30%；報酬率須大於 -100% 且不超過 50%。');
  if(!Number.isInteger(v.mortgageMonths)||v.mortgageMonths>1200||(v.principal>0&&v.mortgageMonths<1)) throw Error('房貸剩餘月數須為 1–1200 個整月（無房貸可填 0）。');
}
export function simulate(v) {
  validate(v);
  const family=v.mode==='family', share=family?1:v.share/100;
  let stocks=v.stock+v.etf+(family?v.partnerStock+v.partnerEtf:0),cash=v.cash+(family?v.partnerCash:0),debt=v.principal*share;
  const invest=v.invest+(family?v.partnerInvest:0),saving=v.saving+(family?v.partnerSaving:0);
  const months=Math.round((v.end-v.age)*12),retirement=Math.round((v.retire-v.age)*12);
  const points=[],point=(m)=>({month:m,age:v.age+m/12,stocks,cash,debt,assets:stocks+cash,real:(stocks+cash)/Math.pow(1+v.inflation/100,m/12)});
  let depletion=null,atRetire=retirement===0?stocks+cash:null;
  points.push(point(0));
  for(let m=1;m<=months;m++) {
    const retired=m>retirement;
    stocks*=Math.pow(1+(retired?v.return:v.growth)/100,1/12);
    let mortgage=0;
    if(debt>0&&m<=v.mortgageMonths) {
      debt*=1+v.mortgageRate/1200;
      mortgage=m===v.mortgageMonths?debt:Math.min(debt,v.payment*share);
      debt=Math.max(0,debt-mortgage);
    }
    if(!retired) {stocks+=invest;cash+=saving;}
    else {
      let flow=(v.rent-v.living*Math.pow(1+v.inflation/100,(m-1)/12))*share-mortgage;
      cash+=flow;
      if(cash<0){stocks+=cash;cash=0;}
      if(stocks+cash<=0&&depletion===null) depletion=v.age+m/12;
      stocks=Math.max(0,stocks);
    }
    points.push(point(m));
    if(m===retirement) atRetire=stocks+cash;
  }
  return {points,atRetire,depletion};
}
