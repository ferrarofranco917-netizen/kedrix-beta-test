const LANDING_URL = "https://kedrix-landing-v2.kedrix-corp.workers.dev";

(function(){
  const url = new URL(window.location.href);
  const tester_id = url.searchParams.get("tester_id");
  const email = url.searchParams.get("email");

  if (tester_id && email) {
    localStorage.setItem("kedrix_tester_id", tester_id);
    localStorage.setItem("kedrix_email", email);
    console.log("Auto login success");
  } else {
    console.log("Redirect to landing");
    window.location.href = LANDING_URL;
  }
})();