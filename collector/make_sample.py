#!/usr/bin/env python3
"""Write a sample log covering several SARA instances.

The console is meant to read CESI, AGLink, Automotive, Mining and
anything built later side by side, so the sample has to contain more
than one instance or the multi-instance behaviour is never exercised.

    python make_sample.py > data/sample-multi.ndjson
"""
import json
import random
import sys
import time

random.seed(7)
NOW = int(time.time() * 1000)
DAY = 86400_000

INSTANCES = [
    ("Mining", "mining", "Vantorra Resources Group"),
    ("CESI", "cesi", "CESI"),
    ("Automotive", "automotive", "Auriga Motor Group"),
    ("AGLink", "aglink", "AGLink Australia"),
]

PEOPLE = [
    ("Priya Raghunathan", "Rio Tinto", "p.raghunathan@example.com", "Mining"),
    ("Bruce Tanaka", "Rio Tinto", "b.tanaka@example.com", "Mining"),
    ("Carmen Delgado", "Antofagasta", "c.delgado@example.com", "Mining"),
    ("Nsofwa Mwansa", "First Quantum", "n.mwansa@example.com", "Mining"),
    ("Alessandro Rossi", "CESI", "a.rossi@example.com", "CESI"),
    ("Marta Colombo", "CESI", "m.colombo@example.com", "CESI"),
    ("Dean Kavanagh", "Auriga Motor Group", "d.kavanagh@example.com", "Automotive"),
    ("Sarah Whitlock", "Auriga Motor Group", "s.whitlock@example.com", "Automotive"),
    ("Tom Beaumont", "AGLink Australia", "t.beaumont@example.com", "AGLink"),
]

QA = {
    "Mining": [
        ("What geotechnical inspections are required after a significant rainfall event?",
         "An inspection is required within 12 hours of the rain stopping and before hauling resumes in the affected area. GCT-412 rev 3.1 sets the trigger on the rainfall total rather than on the current weather, because the failure often occurs after the rain has stopped.",
         "knowledge", ["GCT-412", "GCT-400", "MIN-370"], []),
        ("Kalunga mill head grade has been under the block model for three months. Build me the case.",
         "F1 is stable at 0.99 in both domains, so the resource model is not implicated. F2 in the oxide domain has fallen from 0.99 to 0.88 since March. The mill sampling system was audited in May and cleared. Two changes took effect in February, both in the oxide domain...",
         "knowledge", ["GEO-132", "GEO-131", "PRO-612", "GEO-111", "MIN-311"], ["FIN-830", "PRO-611"]),
        ("I need the cultural heritage survey results for the proposed waste dump extension.",
         "I cannot provide that. The survey information is held under an agreement with the Traditional Owners that names who may access it, and it is not Vantorra's to circulate internally. CSP-700 sets out the ground disturbance clearance process, which is what you need to proceed...",
         "knowledge", ["CSP-700"], ["CSP-710", "CSP-711"]),
        ("What energy sources have to be isolated on a haul truck before working on the hydraulics?",
         "FRS-04 rev 6.0 requires every source present to be isolated, not only the obvious one. On a haul truck that is the battery isolator, starter isolation, hydraulic accumulator bleed, body raise circuit, suspension charge, fire suppression actuator, and body props fitted as mechanical restraint.",
         "knowledge", ["FRS-04", "HSE-211", "MOB-515"], []),
    ],
    "CESI": [
        ("What duties does IEC 62271-100 require for a circuit breaker?",
         "The standard specifies terminal fault duties T10, T30, T60 and T100s, plus short-line fault and out-of-phase duties where declared...",
         "knowledge", ["STD-030", "TST-016"], []),
        ("Build me a quote for the type test programme.",
         "Opening the opportunity in Sales Cloud and building the quote from the duty list.",
         "operator", [], []),
    ],
    "Automotive": [
        ("What is the torque specification for the traction battery isolation bolts?",
         "That procedure sits behind the high voltage authorisation, which your profile does not carry. HV-100 is restricted to appointed high voltage technicians. HSE-005 states where the line is and who to ask.",
         "knowledge", ["HSE-005"], ["HV-100"]),
        ("Raise the repair order for the vehicle.",
         "Opening Titan DMS and creating the repair order from the booking.",
         "operator", [], []),
    ],
    "AGLink": [
        ("Where are members asking the same question without knowing it?",
         "Seven ryegrass enquiries across four members and three states in nineteen days, none of them referencing another. The resistance test window closes in a fortnight.",
         "knowledge", ["AGR-HWSC-01", "ENQ-LOG-Q2"], []),
    ],
}

ROLES = {
    "Mining": ["Mining Engineer", "Mine Manager", "HSE Superintendent", "Grade Control Geologist"],
    "CESI": ["Test Engineer, High Power", "Project Manager"],
    "Automotive": ["Service Advisor", "Diagnostic Technician"],
    "AGLink": ["Agronomist"],
}

TASKS = {
    "Mining": ["permit-isolation", "hazard-incident", "tsf-surveillance", "critical-control-verification"],
    "CESI": ["report-draft", "non-conformity"],
    "Automotive": ["service-booking", "warranty-claim"],
    "AGLink": ["resistance-test"],
}

RUNS = {
    "Mining": ["contractor", "isolation", "maintenance", "safety", "supply", "control"],
    "CESI": ["sales", "planning", "certification"],
    "Automotive": ["service", "parts", "sales"],
    "AGLink": [],
}

out = []
seq = 0


def emit(inst, slug, tenant, vid, who, sid, at, kind, ev, tamper=None):
    global seq
    seq += 1
    ev = dict(ev)
    ev.update({"id": "%s-%d-%s" % (vid, seq, format(at, "x")), "s": sid, "at": at,
               "t": 0, "k": kind})
    if tamper:
        ev["tamper"] = tamper
    visitor = {"id": vid, "first": at, "sessions": 1, "who": who}
    if tamper:
        visitor["tamper"] = tamper
    out.append({
        "app": "SARA", "edition": slug, "label": inst, "level": "full",
        "visitor": visitor,
        "session": {"id": sid, "started": at},
        "server": {"received": "", "ip": "203.0.113.%d" % random.randint(2, 250),
                   "country": random.choice(["AU", "GB", "IT", "ZA", "CL", "IN"]),
                   "origin": "https://demo.example.com/%s/" % slug},
        "event": ev,
    })


for i, (name, org, mail, inst) in enumerate(PEOPLE):
    slug, tenant = next((s, t) for (n, s, t) in INSTANCES if n == inst)
    vid = "v_%s%02d" % (slug[:3], i)
    # a couple of people bypassed the gate, so the console has something to flag
    tamper = ["gate-removed"] if i in (3, 7) else None
    for sess in range(random.randint(1, 3)):
        sid = "s_%s%02d%d" % (slug[:3], i, sess)
        at = NOW - random.randint(0, 26) * DAY - random.randint(0, 8) * 3600_000
        who = {"name": name, "company": org, "email": mail, "at": at}
        emit(inst, slug, tenant, vid, who, sid, at,
             "visit", {"n": sess + 1, "env": {"lang": "en-GB", "screen": "1512x945",
                                              "tz": "Australia/Perth"}, "who": who}, tamper)
        at += 9000
        emit(inst, slug, tenant, vid, who, sid, at, "identify", {"who": who})
        at += 12000
        role = random.choice(ROLES[inst])
        emit(inst, slug, tenant, vid, who, sid, at, "signin", {"r": role})

        for q, a, intent, cite, blkd in random.sample(QA[inst], min(len(QA[inst]), random.randint(1, len(QA[inst])))):
            at += random.randint(25, 240) * 1000
            emit(inst, slug, tenant, vid, who, sid, at, "turn", {
                "q": q, "a": a, "i": intent, "r": role, "mdl": "gpt-5.1",
                "ms": random.randint(900, 4200), "src": len(cite), "blk": len(blkd),
                "ch": len(a), "cite": cite, "blkd": blkd,
            })
            for d in blkd:
                emit(inst, slug, tenant, vid, who, sid, at + 1, "refused", {"did": d, "why": "scope"})

        if TASKS[inst] and random.random() < .6:
            tid = random.choice(TASKS[inst])
            at += 60000
            emit(inst, slug, tenant, vid, who, sid, at, "task", {"did": tid, "e": "start", "n": 0})
            at += 180000
            emit(inst, slug, tenant, vid, who, sid, at, "task", {
                "did": tid, "e": "done", "ttl": tid.replace("-", " ").title(),
                "in": {"site": "Marra Downs", "asset": "CV-204 secondary conveyor",
                       "work": "Replace the drive pulley lagging"},
                "out": "Permit to work — CV-204 secondary conveyor, Marra Downs\n\n"
                       "Energy sources to be isolated: Electrical supply, Hydraulic pressure, "
                       "Stored gravitational energy.\n\nPrepared in SARA. This is a request, not "
                       "an authorisation.",
            })

        if RUNS[inst] and random.random() < .5:
            rid = random.choice(RUNS[inst])
            at += 30000
            emit(inst, slug, tenant, vid, who, sid, at, "operator", {"did": rid, "e": "start"})
            if random.random() < .5:
                at += 20000
                emit(inst, slug, tenant, vid, who, sid, at, "operator",
                     {"did": rid, "e": "ask", "f": random.choice(["asset", "site", "headcount", "priority"])})
            at += 90000
            emit(inst, slug, tenant, vid, who, sid, at, "operator", {
                "did": rid, "e": "done", "ttl": "Mobilise the crew, and stop if the gate fails",
                "in": {"company": "Rockline Mining Services", "site": "Marra Downs", "headcount": "22"},
                "out": "Mobilisation blocked: induction pack v6.2 reproduces HSE-211 rev 4, "
                       "withdrawn 16 Jun 2025. Reissued to v7.0 and access granted.",
            })

# one person who opened it and never identified, to prove the console
# separates that from a real visitor rather than hiding it
out.append({
    "app": "SARA", "edition": "mining", "label": "Mining", "level": "full",
    "visitor": {"id": "v_anon01", "first": NOW - 2 * DAY, "sessions": 1, "who": None},
    "session": {"id": "s_anon01", "started": NOW - 2 * DAY},
    "server": {"ip": "198.51.100.7", "country": "SG", "origin": "https://demo.example.com/mining/"},
    "event": {"id": "v_anon01-1-x", "s": "s_anon01", "at": NOW - 2 * DAY, "t": 0,
              "k": "visit", "n": 1, "env": {"lang": "en-US", "screen": "1280x800"},
              "tamper": ["gate-removed", "gate-hidden"]},
})

out.sort(key=lambda r: r["event"]["at"])
for r in out:
    sys.stdout.write(json.dumps(r, separators=(",", ":")) + "\n")
