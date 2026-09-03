import React, { useState } from "react";
import { Shield } from "lucide-react";
import { S } from "../utils/helpers.js";
import { parseCompetitors, parseDifferentiators } from "../utils/helpers.js";

export default function BattleCardsView({ products }) {
  const [selectedProduct, setSelectedProduct] = useState(products[0] || null);

  if (products.length === 0) {
    return (
      <div className="ps-body">
        <div className="ps-empty">
          <div className="big">No products yet</div>
          <p>Add a product with competitors and differentiators to unlock battle cards.</p>
        </div>
      </div>
    );
  }

  const product = selectedProduct || products[0];
  const competitors = parseCompetitors(product.competitors);
  const differentiators = parseDifferentiators(product.differentiators);

  return (
    <div>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">P4.1</div>
          <div className="ps-title"><Shield size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Battle Cards</div>
          <div className="ps-sub">Quick-reference competitor intel and counter-messaging.</div>
        </div>
      </div>

      <div className="ps-body">
        <div className="lib-filters" style={{ marginBottom: 18 }}>
          <select className="fsel" value={product.id} onChange={(e) => {
            const p = products.find((x) => x.id === e.target.value);
            if (p) setSelectedProduct(p);
          }}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="comp-grid">
          {competitors.map((c, i) => (
            <div key={i} className="comp-card" style={{ borderLeft: "4px solid var(--aggressive)" }}>
              <div className="comp-head">
                <span className="comp-type" style={{ background: "#FDF2F2", color: "var(--aggressive)" }}>Competitor</span>
              </div>
              <div className="comp-name">{c}</div>
              <div className="comp-content" style={{ fontStyle: "normal" }}>
                {product.competitors || "No details on this competitor."}
              </div>
            </div>
          ))}

          {differentiators.map((d, i) => (
            <div key={`diff-${i}`} className="comp-card" style={{ borderLeft: "4px solid var(--ok)" }}>
              <div className="comp-head">
                <span className="comp-type" style={{ background: "#E6F6EF", color: "var(--ok)" }}>Our Edge</span>
              </div>
              <div className="comp-name">{d.title}</div>
              <div className="comp-content" style={{ fontStyle: "normal" }}>{d.body || "No additional details."}</div>
            </div>
          ))}

          {product.proofPoints && (
            <div className="comp-card" style={{ borderLeft: "4px solid var(--accent)" }}>
              <div className="comp-head">
                <span className="comp-type" style={{ background: "var(--accent-bg)", color: "var(--accent-ink)" }}>Proof</span>
              </div>
              <div className="comp-name">Proof Points</div>
              <div className="comp-content" style={{ fontStyle: "normal" }}>{product.proofPoints}</div>
            </div>
          )}
        </div>

        {competitors.length === 0 && differentiators.length === 0 && (
          <div className="ps-empty" style={{ marginTop: 20 }}>
            <div className="big">No battle cards yet</div>
            <p>Add competitors and differentiators to {product.name} to generate battle cards.</p>
          </div>
        )}
      </div>
    </div>
  );
}
