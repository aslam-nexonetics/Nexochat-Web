import { GigBotReply } from "../types/gig";

export class GigBotKnowledgeEngine {
  static getWelcomeMessage(providerName: string, specialization: string, botName?: string): string {
    const name = providerName || "the service provider";
    const spec = specialization || "professional";
    const title = botName || `${name}'s AI Assistant`;

    return `Hello! I'm ${title} 👋\nI can assist you with ${name}'s ${spec} services, provide instant answers on rates, inspection fees & emergency arrival, and schedule an appointment directly.\nHow can I help you today?`;
  }

  static getDefaultSuggestions(specialization: string): string[] {
    const spec = (specialization || "").toLowerCase();

    if (spec.includes("electr")) {
      return [
        "Wiring & MCB tripping",
        "Short circuit emergency",
        "Inspection & visit fee",
        "Switchboard installation",
        "Book appointment",
      ];
    } else if (spec.includes("plumb")) {
      return [
        "Leak repairs",
        "Pipe unclogging",
        "Visit & inspection fee",
        "Emergency response time",
        "Book appointment",
      ];
    } else if (spec.includes("ac") || spec.includes("air") || spec.includes("hvac")) {
      return [
        "Jet foam wet wash",
        "Gas leak & refill",
        "Service charges",
        "Cooling warranty",
        "Book AC service",
      ];
    } else if (spec.includes("carpent")) {
      return [
        "Furniture repair rates",
        "Door & lock repairs",
        "Custom wood fittings",
        "Turnaround timeline",
        "Book site visit",
      ];
    } else if (spec.includes("clean")) {
      return [
        "Deep cleaning rates",
        "Kitchen & bathroom cleaning",
        "Chemicals & equipment",
        "Service guarantee",
        "Book cleaning slot",
      ];
    } else if (spec.includes("appliance")) {
      return [
        "Washing machine checkup",
        "Refrigerator cooling fix",
        "Diagnostic visit fee",
        "Genuine spare parts",
        "Book repair",
      ];
    }

    return [
      "Services offered",
      "Inspection charges",
      "Working hours",
      "Service warranty",
      "Book appointment",
    ];
  }

  static generateAnswer(
    rawQuery: string,
    providerName: string,
    specialization: string,
    hourlyRate?: string | number | null,
    answers?: Record<number, string[]> | null,
    location?: { city?: string; area?: string }
  ): GigBotReply {
    const query = rawQuery.toLowerCase();
    const rateStr = hourlyRate ? `₹${hourlyRate}/hr` : "₹350/hr";
    const name = providerName || "Our certified specialist";
    const spec = specialization || "Service Specialist";
    const loc = [location?.area, location?.city].filter(Boolean).join(", ") || "your local area";

    const toArray = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === "string") return [val];
      if (typeof val === "object") {
        return Object.values(val).filter((x) => typeof x === "string") as string[];
      }
      return [String(val)];
    };

    // Extract questionnaire configured answers (matching Flutter GigBoatConfig getters)
    const selectedServices = toArray(answers?.[1]);
    const emergencyAvailability = toArray(answers?.[2])[0];
    const visitFee = toArray(answers?.[3])[0];
    const workingHours = toArray(answers?.[4])[0];
    const coverageArea = toArray(answers?.[5])[0];
    const materialPolicy = toArray(answers?.[6])[0];
    const warrantyPeriod = toArray(answers?.[7])[0];
    const extraServices = toArray(answers?.[8]);
    const paymentMethods = toArray(answers?.[9])[0];
    const safetyAdvice = toArray(answers?.[10]);

    // 1. Appointment Booking Intent
    if (
      query.includes("book") ||
      query.includes("appointment") ||
      query.includes("schedule") ||
      query.includes("hire") ||
      query.includes("slot")
    ) {
      return {
        text: `I'd be glad to arrange that for you! ${name} is available for booking. You can select your preferred date, time slot, and service address right here.`,
        suggestions: ["Confirm Booking", "Check Rates First", "Working Hours"],
        action: "book_appointment",
      };
    }

    // 2. Services Offered
    if (
      query.includes("service") ||
      query.includes("what do you do") ||
      query.includes("work") ||
      query.includes("help") ||
      query.includes("cleaning") ||
      query.includes("clean") ||
      query.includes("tank") ||
      query.includes("carpet") ||
      query.includes("kitchen")
    ) {
      const allServices = [...selectedServices, ...extraServices];
      const servicesList = allServices.length > 0
        ? allServices.map((s) => `• ${s}`).join("\n")
        : `• Standard ${spec} diagnostics & repairs\n• On-demand home visits\n• Scheduled preventative maintenance\n• Quality guaranteed workmanship`;

      return {
        text: `${name} specializes in professional ${spec} services across ${loc}:\n\n${servicesList}\n\nWould you like an estimate or to schedule an appointment?`,
        suggestions: ["Inspection Fee & Rates", "Working Hours", "Book Appointment"],
      };
    }

    // 3. Pricing & Inspection Charges
    if (
      query.includes("rate") ||
      query.includes("price") ||
      query.includes("charge") ||
      query.includes("cost") ||
      query.includes("fee") ||
      query.includes("visiting") ||
      query.includes("inspection")
    ) {
      const feeText = visitFee || `${rateStr} base visiting fee`;
      const materialsText = materialPolicy || "Genuine branded materials billed at actual cost with receipt";

      return {
        text: `Here are the transparent pricing guidelines for ${name} (${spec}):\n\n💰 Visiting & Inspection Fee: ${feeText}\n📦 Materials & Spare Parts: ${materialsText}\n\nFor major repairs or full projects, ${name} provides a clear upfront quote before starting any work.`,
        suggestions: ["Book Appointment", "Warranty Details", "Payment Methods"],
        action: "view_rates",
      };
    }

    // 4. Emergency & Urgent Callouts
    if (
      query.includes("emergency") ||
      query.includes("urgent") ||
      query.includes("fast") ||
      query.includes("now") ||
      query.includes("today") ||
      query.includes("how long")
    ) {
      const emergencyText = emergencyAvailability || "Same-day urgent visits available based on daily schedule";
      return {
        text: `🚨 Availability Notice:\n\n${emergencyText} by ${name}.\n\nWould you like to book the next available slot now?`,
        suggestions: ["Book Appointment", "Working Hours", "Check Pricing"],
        action: emergencyAvailability?.toLowerCase().includes("no emergency") ? undefined : "book_appointment",
      };
    }

    // 5. Working Hours
    if (
      query.includes("hour") ||
      query.includes("time") ||
      query.includes("open") ||
      query.includes("sunday") ||
      query.includes("weekend")
    ) {
      const hoursText = workingHours || "Mon - Sat: 8:30 AM to 7:00 PM";
      return {
        text: `⏰ Working Hours for ${name}:\n\n${hoursText}\n\nEven when offline, your booking request or query is logged and prioritized the moment ${name} is available.`,
        suggestions: ["Book Appointment", "Service Area", "Services Offered"],
      };
    }

    // 6. Coverage Area & Distance
    if (
      query.includes("area") ||
      query.includes("distance") ||
      query.includes("how far") ||
      query.includes("travel") ||
      query.includes("coverage") ||
      query.includes("location") ||
      query.includes("where") ||
      query.includes("radius")
    ) {
      const areaText = coverageArea || "Within 15 km of local service hub";
      return {
        text: `📍 Service Coverage:\n\n${name} travels ${areaText} across ${loc}.\n\nIf your location is within this zone, you can book an on-site visit with standard travel terms.`,
        suggestions: ["Book Appointment", "Inspection Charges", "Working Hours"],
      };
    }

    // 7. Warranty & Guarantee
    if (
      query.includes("warranty") ||
      query.includes("guarantee") ||
      query.includes("safe") ||
      query.includes("damage") ||
      query.includes("quality")
    ) {
      const warrantyText = warrantyPeriod || "30-day post-service workmanship warranty";
      return {
        text: `🛡️ Service Guarantee:\n\n${name} provides a ${warrantyText} on all completed services. If any issue arises within this period, it will be inspected and resolved without extra charges.`,
        suggestions: ["Book Appointment", "View Service Rates", "Payment Methods"],
      };
    }

    // 8. Payment Methods
    if (
      query.includes("pay") ||
      query.includes("payment") ||
      query.includes("upi") ||
      query.includes("cash") ||
      query.includes("bank") ||
      query.includes("card")
    ) {
      const payText = paymentMethods || "UPI (Google Pay, PhonePe, Paytm), Bank Transfer, or Cash upon completion";
      return {
        text: `💳 Accepted Payment Modes:\n\n${name} accepts: ${payText}.\n\nPayment is collected safely only after you inspect and approve the completed service.`,
        suggestions: ["Book Appointment", "Service Charges", "Warranty Details"],
      };
    }

    // 9. Safety Advice / Preparation
    if (
      query.includes("safe") ||
      query.includes("prepare") ||
      query.includes("waiting") ||
      query.includes("advice") ||
      query.includes("instruction")
    ) {
      const safetyList = safetyAdvice.length > 0
        ? safetyAdvice.map((s) => `• ${s}`).join("\n")
        : "• Keep the work area accessible and safe\n• Ensure water and power supply are turned on if needed\n• Keep valuables securely stored away";

      return {
        text: `⚠️ Safety & Preparation Guidelines from ${name}:\n\n${safetyList}`,
        suggestions: ["Book Appointment", "Working Hours", "Contact Support"],
      };
    }

    // Default Fallback
    return {
      text: `${name} is a verified ${spec} professional serving ${loc}. Feel free to ask about rates, services, working hours, or book an appointment directly!`,
      suggestions: GigBotKnowledgeEngine.getDefaultSuggestions(specialization),
      action: null,
    };
  }
}

export interface GigBoatOption {
  id: string;
  title: string;
}

export interface GigBoatQuestion {
  step: number;
  specialization: string;
  question: string;
  subtitle: string;
  isMultiSelect: boolean;
  hasOtherSpecify?: boolean;
  options: GigBoatOption[];
}

export class GigBoatQuestionsService {
  private static STORAGE_PREFIX = "gig_provider_ai_boat_";

  static async saveBoatConfig(config: any): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `${this.STORAGE_PREFIX}${config.providerId}`,
          JSON.stringify(config)
        );
        if (config.userId && config.userId !== config.providerId) {
          localStorage.setItem(
            `${this.STORAGE_PREFIX}${config.userId}`,
            JSON.stringify(config)
          );
        }
      } catch (e) {
        console.warn("Failed to save boat config locally:", e);
      }
    }
  }

  static async getBoatConfig(
    providerId: number,
    options: {
      defaultSpecialization?: string;
      providerName?: string;
      userId?: number;
    } = {}
  ): Promise<any | null> {
    if (typeof window !== "undefined") {
      try {
        const idsToTry = [providerId, options.userId].filter(Boolean);
        for (const id of idsToTry) {
          const item = localStorage.getItem(`${this.STORAGE_PREFIX}${id}`);
          if (item) {
            return JSON.parse(item);
          }
        }
      } catch (e) {
        console.warn("Failed to read local boat config:", e);
      }
    }

    // Default pre-seeded demo for Arya kg matching Flutter app
    if (
      (options.providerName && options.providerName.toLowerCase().includes("arya")) ||
      providerId === 12 ||
      providerId === 15
    ) {
      return {
        providerId,
        userId: options.userId ?? 12,
        providerName: options.providerName ?? "Arya kg",
        specialization: options.defaultSpecialization ?? "Electrician",
        boatName: "Arya's Electrical Assistant",
        shareSlug: "arya-kg",
        isActive: true,
        isReady: true,
        createdAt: new Date().toISOString(),
        answers: {
          1: [
            "House Wiring & New Installations",
            "Switchboard Installation & Repair",
            "Lighting Solutions (Indoor & Outdoor)",
            "Fault Finding & Troubleshooting",
            "Electrical Repairs & Maintenance",
          ],
          2: ["Yes, 24/7 emergency service available"],
          3: ["₹350 - ₹500 standard inspection fee"],
          4: ["Mon - Sat: 8:30 AM to 7:00 PM"],
          5: ["Within 15 km across city and nearby suburbs"],
          6: ["I supply standard ISI branded materials with bill"],
          7: ["30 days service & workmanship warranty"],
          8: [
            "Ceiling & Exhaust Fans",
            "Inverter & Battery Setup",
            "Water Heaters / Geysers",
          ],
          9: ["UPI (GPay / PhonePe / Paytm / BHIM)", "Cash on completion"],
          10: ["Turn off the main MCB breaker immediately & avoid touching switches"],
        },
      };
    }

    return null;
  }

  static getQuestionsForSpecialization(
    rawSpecialization: string,
    providerName: string
  ): GigBoatQuestion[] {
    const spec = (rawSpecialization || "").trim().toLowerCase();

    if (spec.includes("electr")) {
      return this.getElectricianQuestions(providerName);
    } else if (spec.includes("plumb")) {
      return this.getPlumberQuestions(providerName);
    } else if (spec.includes("ac") || spec.includes("air") || spec.includes("cooling")) {
      return this.getAcServiceQuestions(providerName);
    } else if (spec.includes("carpent")) {
      return this.getCarpenterQuestions(providerName);
    } else if (spec.includes("clean")) {
      return this.getCleaningQuestions(providerName);
    } else if (spec.includes("appliance")) {
      return this.getApplianceQuestions(providerName);
    }
    return this.getGeneralQuestions(rawSpecialization, providerName);
  }

  static getElectricianQuestions(providerName: string): GigBoatQuestion[] {
    return [
      {
        step: 1,
        specialization: "Electrician",
        question: "What type of electrical services do you provide?",
        subtitle: "Select all that apply (you can choose multiple).",
        isMultiSelect: true,
        options: [
          { id: "house_wiring", title: "House Wiring & New Installations" },
          { id: "commercial", title: "Commercial Electrical Work" },
          { id: "switchboard", title: "Switchboard Installation & Repair" },
          { id: "appliances", title: "Appliance Installation (AC, Water Heater etc.)" },
          { id: "lighting", title: "Lighting Solutions (Indoor & Outdoor)" },
          { id: "rewiring", title: "Renovation & Rewiring" },
          { id: "fault_finding", title: "Fault Finding & Troubleshooting" },
          { id: "ev_charger", title: "EV Charger Installation" },
          { id: "repairs", title: "Electrical Repairs & Maintenance" },
        ],
      },
      {
        step: 2,
        specialization: "Electrician",
        question: "Do you offer emergency electrical services?",
        subtitle: "Clients frequently need urgent fixes for short circuits and power outages.",
        isMultiSelect: false,
        options: [
          { id: "24_7", title: "Yes, 24/7 emergency service available" },
          { id: "daytime_urgent", title: "Emergency service during daytime hours only" },
          { id: "weekend_only", title: "Evenings and weekends emergency calls" },
          { id: "scheduled_only", title: "No emergency service — scheduled visits only" },
        ],
      },
      {
        step: 3,
        specialization: "Electrician",
        question: "What is your standard inspection or visiting fee?",
        subtitle: "This will be clearly communicated by your Bot to set expectations.",
        isMultiSelect: false,
        options: [
          { id: "fee_free", title: "Free inspection within 5 km radius" },
          { id: "fee_250_350", title: "₹250 - ₹350 standard diagnosis fee" },
          { id: "fee_350_500", title: "₹350 - ₹500 standard inspection fee" },
          { id: "fee_waived", title: "Visiting fee is waived if job is approved" },
        ],
      },
      {
        step: 4,
        specialization: "Electrician",
        question: "What are your standard working hours & days?",
        subtitle: "Your Bot will tell clients when you are actively on-site.",
        isMultiSelect: false,
        options: [
          { id: "hrs_standard", title: "Mon - Sat: 8:30 AM to 7:00 PM" },
          { id: "hrs_all_days", title: "Mon - Sun: 8:00 AM to 8:30 PM" },
          { id: "hrs_flexible", title: "Flexible on-demand timings" },
        ],
      },
      {
        step: 5,
        specialization: "Electrician",
        question: "What is your operational service radius?",
        subtitle: "Help your Bot filter out requests that are too far away.",
        isMultiSelect: false,
        options: [
          { id: "rad_5", title: "Within 5 km from my base area" },
          { id: "rad_15", title: "Within 15 km across city and nearby suburbs" },
          { id: "rad_30", title: "Up to 30 km across the entire district" },
        ],
      },
      {
        step: 6,
        specialization: "Electrician",
        question: "How do you handle materials and spare parts?",
        subtitle: "Wires, switches, MCBs, fixtures, conduits, and accessories.",
        isMultiSelect: false,
        options: [
          { id: "parts_i_provide", title: "I supply standard ISI branded materials with bill" },
          { id: "parts_client", title: "Client must purchase parts; I provide labor only" },
          { id: "parts_both", title: "Either option: I can supply or client can purchase" },
        ],
      },
      {
        step: 7,
        specialization: "Electrician",
        question: "What warranty do you offer on electrical repairs?",
        subtitle: "Helps your Bot build strong confidence with new clients.",
        isMultiSelect: false,
        options: [
          { id: "war_30", title: "30 days service & workmanship warranty" },
          { id: "war_90", title: "90 days comprehensive warranty" },
          { id: "war_custom", title: "Warranty depends on manufacturer & parts used" },
        ],
      },
      {
        step: 8,
        specialization: "Electrician",
        question: "Which appliances do you specialize in installing & servicing?",
        subtitle: "Select all appliance categories you are comfortable repairing.",
        isMultiSelect: true,
        options: [
          { id: "app_fans", title: "Ceiling & Exhaust Fans" },
          { id: "app_inverter", title: "Inverter & Battery Setup" },
          { id: "app_geyser", title: "Water Heaters / Geysers" },
          { id: "app_motor", title: "Water Pump & Motor Starters" },
          { id: "app_mcb", title: "MCB / DB Box Distribution Boards" },
        ],
      },
      {
        step: 9,
        specialization: "Electrician",
        question: "Which payment methods do you accept?",
        subtitle: "Your Bot will inform clients before confirming the booking.",
        isMultiSelect: true,
        options: [
          { id: "pay_upi", title: "UPI (GPay / PhonePe / Paytm / BHIM)" },
          { id: "pay_cash", title: "Cash on completion" },
          { id: "pay_bank", title: "Direct Net Banking / NEFT" },
        ],
      },
      {
        step: 10,
        specialization: "Electrician",
        question: "What emergency safety advice should your Bot give to clients?",
        subtitle: "Automated guidance sent immediately if a client reports a danger.",
        isMultiSelect: false,
        options: [
          { id: "safe_breaker", title: "Turn off the main MCB breaker immediately & avoid touching switches" },
          { id: "safe_unplug", title: "Unplug the appliance & do not splash water" },
          { id: "safe_custom", title: "Send photos of the problem and await provider arrival" },
        ],
      },
    ];
  }

  static getPlumberQuestions(providerName: string): GigBoatQuestion[] {
    return [
      {
        step: 1,
        specialization: "Plumber",
        question: "What plumbing services do you provide?",
        subtitle: "Select all that apply.",
        isMultiSelect: true,
        options: [
          { id: "leak_fix", title: "Pipe Leaks & Joint Welding" },
          { id: "drainage", title: "Drain Unclogging & Block Removal" },
          { id: "fittings", title: "Tap, Shower & Sanitary Fixture Fittings" },
          { id: "motor_pump", title: "Water Pump & Pressure Motor Repair" },
          { id: "tank_clean", title: "Overhead Tank Cleaning & Float Valve Fix" },
        ],
      },
      {
        step: 2,
        specialization: "Plumber",
        question: "Do you offer emergency burst pipe or overflow visits?",
        subtitle: "Urgent plumbing emergencies require quick arrival.",
        isMultiSelect: false,
        options: [
          { id: "p_24_7", title: "Yes, 24/7 on-call for burst pipes and floods" },
          { id: "p_day", title: "Daytime emergency calls only (8am - 8pm)" },
          { id: "p_scheduled", title: "Scheduled appointments only" },
        ],
      },
      {
        step: 3,
        specialization: "Plumber",
        question: "What is your visiting / inspection charge?",
        subtitle: "Sets standard visit expectations.",
        isMultiSelect: false,
        options: [
          { id: "p_fee_250", title: "₹200 - ₹300 visit fee" },
          { id: "p_fee_350", title: "₹300 - ₹450 diagnosis charge" },
          { id: "p_fee_waived", title: "Visiting fee waived if repair is done" },
        ],
      },
      {
        step: 4,
        specialization: "Plumber",
        question: "What warranty do you offer on pipework and fittings?",
        subtitle: "Workmanship guarantee for clients.",
        isMultiSelect: false,
        options: [
          { id: "p_war_30", title: "30 days leak-free workmanship guarantee" },
          { id: "p_war_90", title: "90 days warranty on full bathroom plumbing" },
          { id: "p_war_parts", title: "Brand warranty on supplied taps & valves" },
        ],
      },
      {
        step: 5,
        specialization: "Plumber",
        question: "Which payment options do you support?",
        subtitle: "Informs clients prior to service.",
        isMultiSelect: true,
        options: [
          { id: "p_upi", title: "UPI (Google Pay, PhonePe, Paytm)" },
          { id: "p_cash", title: "Cash on delivery" },
          { id: "p_bank", title: "Bank Transfer" },
        ],
      },
    ];
  }

  static getAcServiceQuestions(providerName: string): GigBoatQuestion[] {
    return [
      {
        step: 1,
        specialization: "AC Service",
        question: "What AC repair and service types do you specialize in?",
        subtitle: "Select all that apply.",
        isMultiSelect: true,
        options: [
          { id: "ac_foam_jet", title: "High-Pressure Foam Jet Wet Wash" },
          { id: "ac_gas_refill", title: "Refrigerant Gas Leak & Full Top-up" },
          { id: "ac_install", title: "Split / Window AC Uninstallation & Installation" },
          { id: "ac_pcb_repair", title: "Inverter PCB Diagnostic & Circuit Repair" },
        ],
      },
      {
        step: 2,
        specialization: "AC Service",
        question: "What cooling warranty do you offer post-service?",
        subtitle: "Confidence booster for AC customers.",
        isMultiSelect: false,
        options: [
          { id: "ac_war_30", title: "30 days cooling & service warranty" },
          { id: "ac_war_60", title: "60 days gas-leak guarantee" },
          { id: "ac_war_none", title: "Standard testing upon completion" },
        ],
      },
      {
        step: 3,
        specialization: "AC Service",
        question: "What is your standard inspection charge?",
        subtitle: "Diagnostic visit charge if repair is not completed.",
        isMultiSelect: false,
        options: [
          { id: "ac_fee_300", title: "₹300 standard inspection" },
          { id: "ac_fee_450", title: "₹450 detailed diagnostic check" },
          { id: "ac_fee_free", title: "Free inspection if serviced" },
        ],
      },
      {
        step: 4,
        specialization: "AC Service",
        question: "Payment methods accepted?",
        subtitle: "Payment modes.",
        isMultiSelect: true,
        options: [
          { id: "ac_upi", title: "UPI (GPay / PhonePe / Paytm)" },
          { id: "ac_cash", title: "Cash on completion" },
        ],
      },
    ];
  }

  static getCarpenterQuestions(providerName: string): GigBoatQuestion[] {
    return [
      {
        step: 1,
        specialization: "Carpentry",
        question: "What carpentry and woodwork services do you offer?",
        subtitle: "Select your key craft specialties.",
        isMultiSelect: true,
        options: [
          { id: "c_furniture", title: "Furniture Repair, Polishing & Assembly" },
          { id: "c_doors", title: "Door, Window & Lock Fittings" },
          { id: "c_kitchen", title: "Modular Kitchen Cabinets & Shelving" },
          { id: "c_custom", title: "Custom Bed, Wardrobe & Wood Crafting" },
        ],
      },
      {
        step: 2,
        specialization: "Carpentry",
        question: "What is your site visit / inspection fee?",
        subtitle: "Measuring and estimation charge.",
        isMultiSelect: false,
        options: [
          { id: "c_free", title: "Free measurement visit within city" },
          { id: "c_fee_300", title: "₹250 - ₹350 standard measurement visit" },
        ],
      },
      {
        step: 3,
        specialization: "Carpentry",
        question: "Payment methods accepted?",
        subtitle: "Accepted forms of payment.",
        isMultiSelect: true,
        options: [
          { id: "c_upi", title: "UPI (GPay / PhonePe / Paytm)" },
          { id: "c_cash", title: "Cash on delivery" },
          { id: "c_bank", title: "Bank Transfer" },
        ],
      },
    ];
  }

  static getCleaningQuestions(providerName: string): GigBoatQuestion[] {
    return [
      {
        step: 1,
        specialization: "Cleaning",
        question: "What professional cleaning services do you provide?",
        subtitle: "Select all packages you offer.",
        isMultiSelect: true,
        options: [
          { id: "cl_deep", title: "Full House Deep Cleaning (1BHK/2BHK/3BHK/Villa)" },
          { id: "cl_kitchen", title: "Kitchen Degreasing & Chimney Scrub" },
          { id: "cl_bathroom", title: "Bathroom Tile & Stain Removal" },
          { id: "cl_sofa", title: "Sofa, Carpet & Mattress Shampooing" },
        ],
      },
      {
        step: 2,
        specialization: "Cleaning",
        question: "Do you supply your own professional machines and chemicals?",
        subtitle: "Helps clients prepare.",
        isMultiSelect: false,
        options: [
          { id: "cl_all_equip", title: "Yes, we bring vacuum machines, ladders, and eco-safe chemicals" },
          { id: "cl_labor_only", title: "Labor only; client provides cleaning materials" },
        ],
      },
      {
        step: 3,
        specialization: "Cleaning",
        question: "Payment methods accepted?",
        subtitle: "Payment modes.",
        isMultiSelect: true,
        options: [
          { id: "cl_upi", title: "UPI (GPay / PhonePe / Paytm)" },
          { id: "cl_cash", title: "Cash on completion" },
        ],
      },
    ];
  }

  static getApplianceQuestions(providerName: string): GigBoatQuestion[] {
    return [
      {
        step: 1,
        specialization: "Appliances",
        question: "Which home appliances do you repair?",
        subtitle: "Select all categories you service.",
        isMultiSelect: true,
        options: [
          { id: "ap_washing", title: "Washing Machine (Front & Top Load)" },
          { id: "ap_fridge", title: "Refrigerator (Single/Double Door & Inverter)" },
          { id: "ap_microwave", title: "Microwave & Convection Oven" },
          { id: "ap_tv", title: "LED / Smart TV Screen & Board Repair" },
        ],
      },
      {
        step: 2,
        specialization: "Appliances",
        question: "What is your diagnosis / inspection charge?",
        subtitle: "Visit fee to inspect faulty equipment.",
        isMultiSelect: false,
        options: [
          { id: "ap_fee_300", title: "₹250 - ₹350 standard diagnostic visit" },
          { id: "ap_fee_waived", title: "Diagnostic fee waived if repair is approved" },
        ],
      },
      {
        step: 3,
        specialization: "Appliances",
        question: "Warranty on replaced parts?",
        subtitle: "Confidence guarantee.",
        isMultiSelect: false,
        options: [
          { id: "ap_war_90", title: "90 days warranty on replaced genuine parts" },
          { id: "ap_war_30", title: "30 days general service warranty" },
        ],
      },
    ];
  }

  static getGeneralQuestions(
    rawSpecialization: string,
    providerName: string
  ): GigBoatQuestion[] {
    const spec = rawSpecialization || "Service";
    return [
      {
        step: 1,
        specialization: spec,
        question: `What ${spec} services do you specialize in?`,
        subtitle: "Select all options that describe your craft.",
        isMultiSelect: true,
        options: [
          { id: "gen_residential", title: `Standard Residential ${spec} Tasks` },
          { id: "gen_emergency", title: `Urgent & Emergency Repairs` },
          { id: "gen_renovation", title: `New Installations & Renovations` },
          { id: "gen_maintenance", title: `Routine Maintenance & Inspection` },
        ],
      },
      {
        step: 2,
        specialization: spec,
        question: "Do you offer emergency or same-day visits?",
        subtitle: "Emergency response timing.",
        isMultiSelect: false,
        options: [
          { id: "gen_same_day", title: "Same-day on-demand visits available" },
          { id: "gen_scheduled", title: "Advance scheduled bookings only" },
        ],
      },
      {
        step: 3,
        specialization: spec,
        question: "Standard visit or inspection fee?",
        subtitle: "Visiting charge communicated to clients.",
        isMultiSelect: false,
        options: [
          { id: "gen_fee_std", title: "₹300 standard visit charge" },
          { id: "gen_fee_free", title: "Free inspection if job is confirmed" },
        ],
      },
      {
        step: 4,
        specialization: spec,
        question: "Workmanship warranty offered?",
        subtitle: "Workmanship guarantee for clients.",
        isMultiSelect: false,
        options: [
          { id: "gen_war_30", title: "30 days service warranty" },
          { id: "gen_war_none", title: "Standard testing upon completion" },
        ],
      },
      {
        step: 5,
        specialization: spec,
        question: "Accepted payment methods?",
        subtitle: "Accepted forms of payment.",
        isMultiSelect: true,
        options: [
          { id: "gen_upi", title: "UPI (Google Pay, PhonePe, Paytm)" },
          { id: "gen_cash", title: "Cash on completion" },
        ],
      },
    ];
  }
}
