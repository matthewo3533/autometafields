import { redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useFetcher } from "@remix-run/react";
import styles from "./styles.module.css";
import { useEffect, useState } from "react";

export const loader = async ({ request }) => {
  const { authenticate } = await import("../../shopify.server");
  try {
    await authenticate.admin(request);
    return { showForm: false };
  } catch (err) {
    let errorMsg = "";
    if (err instanceof Response) {
      errorMsg = `Response status: ${err.status} ${err.statusText}`;
    } else {
      errorMsg = err.message || String(err);
    }
    console.error("AUTH ERROR", err);
    return { showForm: true, error: errorMsg };
  }
};

export const action = async ({ request }) => {
  const { authenticate } = await import("../../shopify.server");
  const { applyMetafieldRulesToAllProducts } = await import("../../services/metafields.server");
  const { admin, shop, session } = await authenticate.admin(request);
  await applyMetafieldRulesToAllProducts(admin, shop, session);
  return { triggered: true };
};

export default function App() {
  const { showForm, error } = useLoaderData();
  const actionData = useActionData();
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    id: null,
    collectionTitle: "",
    namespace: "custom",
    key: "",
    type: "single_line_text_field",
    value: "",
    ownerResource: "product",
  });
  const [editing, setEditing] = useState(false);
  const [authCheckResult, setAuthCheckResult] = useState(null);
  const fetcher = useFetcher();

  useEffect(() => {
    fetch("/api/rules").then(r => r.json()).then(setRules);
    fetch("/api/logs").then(r => r.json()).then(setLogs);
    if (fetcher.data && fetcher.data.authCheck !== undefined) {
      setAuthCheckResult(fetcher.data.authCheck);
    }
  }, [fetcher.data]);

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRuleSubmit = async e => {
    e.preventDefault();
    const method = editing ? "update" : "create";
    const body = editing ? { _method: method, id: form.id, rule: form } : { _method: method, rule: form };
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setForm({ id: null, collectionTitle: "", namespace: "custom", key: "", type: "single_line_text_field", value: "", ownerResource: "product" });
    setEditing(false);
    fetch("/api/rules").then(r => r.json()).then(setRules);
  };

  const handleEdit = rule => {
    setForm(rule);
    setEditing(true);
  };

  const handleDelete = async id => {
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _method: "delete", id }),
    });
    fetch("/api/rules").then(r => r.json()).then(setRules);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: 32,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(60,72,88,0.10)',
        padding: 32,
        maxWidth: 700,
        width: '100%',
        marginTop: 32,
      }}>
        <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#2d3748' }}>Metafield Rule Manager</h1>
        <h2 style={{ fontWeight: 600, fontSize: 20, margin: '24px 0 8px', color: '#4a5568' }}>Add or Edit a Metafield Rule</h2>
        <p style={{ marginBottom: 16, color: '#718096', fontSize: 15 }}>
          Define a rule to automatically assign a metafield to products in a specific collection.<br/>
          <b>Example:</b> Products in the <i>Amethyst</i> collection get metafield <i>custom.zodiac_category = Pisces</i>.
        </p>
        <form onSubmit={handleRuleSubmit} style={{ marginBottom: 32, background: '#f7fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(60,72,88,0.04)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontWeight: 500, color: '#4a5568' }}>Collection Title<br/>
                <input name="collectionTitle" value={form.collectionTitle} onChange={handleFormChange} placeholder="e.g. Amethyst" required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
                <span style={{ fontSize: 12, color: '#a0aec0' }}>Products in this collection will get the metafield.</span>
              </label>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontWeight: 500, color: '#4a5568' }}>Metafield Namespace<br/>
                <input name="namespace" value={form.namespace} onChange={handleFormChange} placeholder="e.g. custom" required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
                <span style={{ fontSize: 12, color: '#a0aec0' }}>Usually "custom" for custom metafields.</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontWeight: 500, color: '#4a5568' }}>Metafield Key<br/>
                <input name="key" value={form.key} onChange={handleFormChange} placeholder="e.g. zodiac_category" required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
                <span style={{ fontSize: 12, color: '#a0aec0' }}>The metafield name (key).</span>
              </label>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontWeight: 500, color: '#4a5568' }}>Metafield Type<br/>
                <input name="type" value={form.type} onChange={handleFormChange} placeholder="e.g. single_line_text_field" required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
                <span style={{ fontSize: 12, color: '#a0aec0' }}>Shopify type, e.g. "single_line_text_field" or "string".</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontWeight: 500, color: '#4a5568' }}>Metafield Value<br/>
                <input name="value" value={form.value} onChange={handleFormChange} placeholder="e.g. Pisces" required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
                <span style={{ fontSize: 12, color: '#a0aec0' }}>The value to assign to the metafield.</span>
              </label>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontWeight: 500, color: '#4a5568' }}>Owner Resource<br/>
                <input name="ownerResource" value={form.ownerResource} onChange={handleFormChange} placeholder="e.g. product" required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }} />
                <span style={{ fontSize: 12, color: '#a0aec0' }}>Usually "product" for product metafields.</span>
              </label>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="submit" style={{
              marginRight: 12,
              background: editing ? '#3182ce' : '#38a169',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(60,72,88,0.08)',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = editing ? '#225ea8' : '#2f855a'}
            onMouseOut={e => e.currentTarget.style.background = editing ? '#3182ce' : '#38a169'}
            >{editing ? "Update Rule" : "Add Rule"}</button>
            {editing && <button type="button" onClick={() => { setEditing(false); setForm({ id: null, collectionTitle: "", namespace: "custom", key: "", type: "single_line_text_field", value: "", ownerResource: "product" }); }} style={{
              background: '#e53e3e',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(60,72,88,0.08)',
              marginLeft: 8,
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#b91c1c'}
            onMouseOut={e => e.currentTarget.style.background = '#e53e3e'}
            >Cancel</button>}
          </div>
        </form>
        <h2 style={{ fontWeight: 600, fontSize: 20, margin: '32px 0 12px', color: '#4a5568' }}>Existing Rules</h2>
        <div style={{ overflowX: 'auto', marginBottom: 32 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#f7fafc', borderRadius: 12, boxShadow: '0 1px 4px rgba(60,72,88,0.04)' }}>
            <thead>
              <tr style={{ background: '#e2e8f0' }}>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Collection</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Namespace</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Key</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Type</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Value</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Owner</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} style={{ transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#edf2f7'} onMouseOut={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: 10 }}>{rule.collectionTitle}</td>
                  <td style={{ padding: 10 }}>{rule.namespace}</td>
                  <td style={{ padding: 10 }}>{rule.key}</td>
                  <td style={{ padding: 10 }}>{rule.type}</td>
                  <td style={{ padding: 10 }}>{rule.value}</td>
                  <td style={{ padding: 10 }}>{rule.ownerResource}</td>
                  <td style={{ padding: 10 }}>
                    <button onClick={() => handleEdit(rule)} style={{
                      background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 500, marginRight: 8, cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#225ea8'}
                    onMouseOut={e => e.currentTarget.style.background = '#3182ce'}
                    >Edit</button>
                    <button onClick={() => handleDelete(rule.id)} style={{
                      background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#b91c1c'}
                    onMouseOut={e => e.currentTarget.style.background = '#e53e3e'}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 style={{ fontWeight: 600, fontSize: 20, margin: '32px 0 12px', color: '#4a5568' }}>Recent Metafield Assignment Logs</h2>
        <div style={{ overflowX: 'auto', marginBottom: 32 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#f7fafc', borderRadius: 12, boxShadow: '0 1px 4px rgba(60,72,88,0.04)' }}>
            <thead>
              <tr style={{ background: '#e2e8f0' }}>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Time</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Product ID</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Status</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Rule</th>
                <th style={{ padding: 10, fontWeight: 600, color: '#2d3748', textAlign: 'left' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#edf2f7'} onMouseOut={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: 10 }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 10 }}>{log.productId}</td>
                  <td style={{ padding: 10 }}>{log.status}</td>
                  <td style={{ padding: 10 }}>{log.rule ? `${log.rule.collectionTitle} / ${log.rule.key}` : ""}</td>
                  <td style={{ padding: 10 }}>{(() => {
                    try {
                      const msg = JSON.parse(log.message);
                      if (msg.error) {
                        return <div>
                          <div><b>Error:</b> {msg.error}</div>
                          <div style={{ fontSize: 12, color: '#718096' }}><b>Input:</b> {JSON.stringify(msg.input)}</div>
                        </div>;
                      } else if (msg.input) {
                        return <div style={{ fontSize: 12, color: '#718096' }}><b>Input:</b> {JSON.stringify(msg.input)}</div>;
                      }
                    } catch (e) {
                      // Not JSON, show as is
                      return log.message;
                    }
                    return log.message;
                  })()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Only show the manual trigger if authenticated */}
        {showForm ? (
          <div style={{ color: '#e53e3e', fontWeight: 500, marginTop: 24 }}>
            Please log in with your Shopify store domain to use the manual trigger.
            {error && <div style={{ color: 'red', marginTop: 8 }}>Auth error: {error}</div>}
          </div>
        ) : (
          <Form method="post">
            <button className={styles.button} type="submit" style={{
              background: '#805ad5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 1px 4px rgba(60,72,88,0.08)', marginTop: 8, transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#553c9a'}
            onMouseOut={e => e.currentTarget.style.background = '#805ad5'}
            >Run Metafield Rules on All Products</button>
          </Form>
        )}
        {actionData?.triggered && (
          <div className={styles.text} style={{ color: '#38a169', fontWeight: 600, marginTop: 16 }}>
            Metafield rules are being applied to all products.
          </div>
        )}
        <div style={{ marginTop: 24 }}>
          <fetcher.Form method="get" action="/api/check-auth">
            <button type="submit" style={{
              background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px rgba(60,72,88,0.08)', marginRight: 12
            }}>Check Shopify Auth</button>
            {authCheckResult !== null && (
              <span style={{ marginLeft: 12, fontWeight: 500, color: authCheckResult ? '#38a169' : '#e53e3e' }}>
                {authCheckResult ? 'Authenticated!' : 'Not authenticated!'}
              </span>
            )}
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
