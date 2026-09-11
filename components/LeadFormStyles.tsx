export default function LeadFormStyles() {
  return <style jsx global>{`
    .lead-input {
      width: 100%;
      min-height: 50px;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 14px;
      background: rgba(255,255,255,.045);
      color: #fff;
      padding: 13px 15px;
      outline: none;
      transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
    }
    .lead-input::placeholder { color: #64748b; }
    .lead-input:focus {
      border-color: rgba(25,183,255,.7);
      background: rgba(25,183,255,.055);
      box-shadow: 0 0 0 3px rgba(25,183,255,.09);
    }
    select.lead-input { appearance: auto; }
    select.lead-input option { background: #0b1b30; color: #fff; }
  `}</style>;
}
