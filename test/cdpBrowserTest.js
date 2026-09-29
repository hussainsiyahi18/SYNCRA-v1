import { spawn } from "child_process";

async function run() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chromeProc = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=C:\\Users\\hp\\.gemini\\antigravity-ide\\chrome-test-profile",
    "http://localhost:5173/"
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch("http://localhost:9222/json/list");
    const pages = await listRes.json();
    const page = pages.find(p => p.url.includes("localhost:5173"));
    if (!page) {
      console.error("Page not found in list");
      return;
    }

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = id++;
      const handler = (data) => {
        const msg = JSON.parse(data.data);
        if (msg.id === msgId) {
          ws.removeEventListener("message", handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    let exceptions = [];
    ws.addEventListener("message", (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === "Runtime.exceptionThrown") {
        const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        console.error("🔥 [BROWSER EXCEPTION]", desc);
        exceptions.push(desc);
      }
    });

    await send("Runtime.enable");
    await send("Page.enable");
    await new Promise(r => setTimeout(r, 800));

    // 1. Skip Intro
    await send("Runtime.evaluate", {
      expression: 'document.querySelector(".intro-skip-btn")?.click()'
    });
    await new Promise(r => setTimeout(r, 400));

    // 2. Login as PM
    await send("Runtime.evaluate", {
      expression: 'document.getElementById("btn-quick-login-manager")?.click()'
    });
    await new Promise(r => setTimeout(r, 400));

    // 3. In Workspace Directory: Click Alpha Facility
    console.log("TEST 1: Click Alpha Facility from Workspace Directory");
    await send("Runtime.evaluate", {
      expression: 'document.getElementById("workspace-card-alpha-facility-assam")?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    let res = await send("Runtime.evaluate", {
      expression: `({
        hasAppShell: Boolean(document.querySelector(".app-shell")),
        hasOverview: Boolean(document.querySelector(".content")),
        projectName: document.querySelector(".project-name")?.innerText,
        bodyLen: document.body.innerHTML.length
      })`,
      returnByValue: true
    });
    console.log("Alpha render result:", res.result?.value);
    if (!res.result?.value?.hasAppShell || res.result?.value?.bodyLen < 200) {
      console.error("❌ ALPHA RENDER FAILED / BLANK!");
    } else {
      console.log("✓ PM -> Alpha Facility rendered normally!");
    }

    // 4. Return to Workspace
    console.log("\nTEST 2: Return to Workspace Directory");
    await send("Runtime.evaluate", {
      expression: 'document.getElementById("btn-sidebar-switch-project")?.click()'
    });
    await new Promise(r => setTimeout(r, 400));

    // 5. Click Rajasthan
    console.log("TEST 3: Click Rajasthan from Workspace Directory");
    await send("Runtime.evaluate", {
      expression: 'document.getElementById("workspace-card-thar-solar-rajasthan")?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    res = await send("Runtime.evaluate", {
      expression: `({
        hasAppShell: Boolean(document.querySelector(".app-shell")),
        hasOverview: Boolean(document.querySelector(".content")),
        projectName: document.querySelector(".project-name")?.innerText,
        bodyLen: document.body.innerHTML.length
      })`,
      returnByValue: true
    });
    console.log("Rajasthan render result:", res.result?.value);
    if (!res.result?.value?.hasAppShell || res.result?.value?.bodyLen < 200) {
      console.error("❌ RAJASTHAN RENDER FAILED / BLANK!");
    } else {
      console.log("✓ PM -> Rajasthan rendered normally!");
    }

    // 6. Return to Workspace
    console.log("\nTEST 4: Return to Workspace Directory from Rajasthan");
    await send("Runtime.evaluate", {
      expression: 'document.getElementById("btn-sidebar-switch-project")?.click()'
    });
    await new Promise(r => setTimeout(r, 400));

    // 7. Click Alpha Facility again
    console.log("TEST 5: Click Alpha Facility from Workspace Directory (Transition: Rajasthan -> Alpha)");
    await send("Runtime.evaluate", {
      expression: 'document.getElementById("workspace-card-alpha-facility-assam")?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    res = await send("Runtime.evaluate", {
      expression: `({
        hasAppShell: Boolean(document.querySelector(".app-shell")),
        hasOverview: Boolean(document.querySelector(".content")),
        projectName: document.querySelector(".project-name")?.innerText,
        bodyLen: document.body.innerHTML.length
      })`,
      returnByValue: true
    });
    console.log("Alpha re-render result:", res.result?.value);
    if (!res.result?.value?.hasAppShell || res.result?.value?.bodyLen < 200) {
      console.error("❌ ALPHA RE-RENDER FAILED / BLANK!");
    } else {
      console.log("✓ Rajasthan -> Alpha rendered normally!");
    }

    // 8. Test dropdown switch directly: Alpha -> Rajasthan
    console.log("\nTEST 6: Dropdown switch Alpha -> Rajasthan");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const sel = document.getElementById("project-switcher-select");
        sel.value = "thar-solar-rajasthan";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    res = await send("Runtime.evaluate", {
      expression: `({
        hasAppShell: Boolean(document.querySelector(".app-shell")),
        projectName: document.querySelector(".project-name")?.innerText
      })`,
      returnByValue: true
    });
    console.log("Dropdown switch result:", res.result?.value);

    // 9. Test dropdown switch directly: Rajasthan -> Alpha
    console.log("\nTEST 7: Dropdown switch Rajasthan -> Alpha");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const sel = document.getElementById("project-switcher-select");
        sel.value = "alpha-facility-assam";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    res = await send("Runtime.evaluate", {
      expression: `({
        hasAppShell: Boolean(document.querySelector(".app-shell")),
        projectName: document.querySelector(".project-name")?.innerText
      })`,
      returnByValue: true
    });
    console.log("Dropdown switch result:", res.result?.value);

    // 10. Test all PM navigation tabs for Alpha
    console.log("\nTEST 8: Test all PM navigation tabs for Alpha");
    const navButtons = [
      { name: "Execution & Impact", text: "Execution & Impact" },
      { name: "Recovery Decisions", text: "Recovery Decisions" },
      { name: "Intelligence", text: "Intelligence" },
      { name: "Updated Schedule", text: "Updated Schedule" },
      { name: "Overview", text: "Overview" }
    ];

    for (const nav of navButtons) {
      await send("Runtime.evaluate", {
        expression: `(() => {
          const btn = Array.from(document.querySelectorAll(".nav-item")).find(b => b.innerText.includes("${nav.text}"));
          if (btn) btn.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 400));
      res = await send("Runtime.evaluate", {
        expression: `({
          bodyLen: document.body.innerHTML.length,
          hasAppShell: Boolean(document.querySelector(".app-shell")),
          h1: document.querySelector("h1")?.innerText
        })`,
        returnByValue: true
      });
      console.log(`  Tab '${nav.name}' -> ${res.result?.value?.h1} (body: ${res.result?.value?.bodyLen} chars)`);
    }

    console.log("\nTotal Browser Exceptions captured:", exceptions.length);
    if (exceptions.length > 0) {
      console.error("Exceptions:", exceptions);
    } else {
      console.log("✅ ZERO EXCEPTIONS IN BROWSER ACROSS ALL PM TRANSITIONS!");
    }

    ws.close();
  } catch (err) {
    console.error("Browser test crashed:", err);
  } finally {
    chromeProc.kill();
  }
}

run();
