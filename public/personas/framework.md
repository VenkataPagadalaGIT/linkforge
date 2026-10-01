---
type: Classification library
title: Global Persona Framework
version: 23 September 2026
person: Venkata Pagadala
canonical: https://venkatapagadala.com/personas/framework
workbook: https://venkatapagadala.com/personas/framework/Global_Persona_Classification_Framework.xlsx
dimensions: 463
families: 42
generated_from: public/personas/framework/Global_Persona_Classification_Framework.xlsx
---

# Global Persona Framework

An extensible classification library, not a measured segmentation of every person on Earth.

463 dimensions in 42 families. 148 reference a named source; the rest are authored classifications with no population estimate attached. Every dimension states its definition and global rule, the follow-up question that turns it into an input, the scope and evidence that would support a value, and how the value must be handled.

Canonical: https://venkatapagadala.com/personas/framework
Workbook: https://venkatapagadala.com/personas/framework/Global_Persona_Classification_Framework.xlsx
Used by: https://venkatapagadala.com/personas/fanout-journey

## Rules

- USE: Filter the domains. Choose only relevant fields in column F. For Multiple selections, type values separated by semicolons.
- SELECTION TYPES: Single or Scale = one choice; Multiple = several; Numeric = amount + unit; Text = open label; Repeated = a contextual record.
- ALL FIELDS ACCEPT: Other / self-describe; Unknown; Not applicable; Prefer not to say. Preserve local labels and extend as needed.
- GLOBAL DEFINITIONS: Use local currency, period, market, and household basis. Do not apply one country's class, race, or generation labels worldwide.
- KEEP SEPARATE: Income, wealth, purchase budget, luxury preference, and spending. Identity does not determine behavior or interests.
- SAFE USE: Collect only relevant, permissioned information. Child-related and sensitive contexts need appropriate safeguards; no discriminatory eligibility use.

## Families

- [01 Age & life stage](#f01-age-life-stage): 7 dimensions
- [02 Identity & self-description](#f02-identity-self-description): 9 dimensions
- [03 Geography & settlement](#f03-geography-settlement): 10 dimensions
- [04 Language & cultural practices](#f04-language-cultural-practices): 9 dimensions
- [05 Household & relationships](#f05-household-relationships): 9 dimensions
- [06 Parenting & caregiving](#f06-parenting-caregiving): 9 dimensions
- [07 Housing & living environment](#f07-housing-living-environment): 10 dimensions
- [08 Education & skills](#f08-education-skills): 9 dimensions
- [09 Work & livelihood](#f09-work-livelihood): 11 dimensions
- [10 Income & financial position](#f10-income-financial-position): 11 dimensions
- [11 Wealth, liquidity & resilience](#f11-wealth-liquidity-resilience): 9 dimensions
- [12 Purchase budget & affordability context](#f12-purchase-budget-affordability-context): 12 dimensions
- [13 Price, value & luxury preferences](#f13-price-value-luxury-preferences): 11 dimensions
- [14 Spending patterns & allocation](#f14-spending-patterns-allocation): 12 dimensions
- [15 Everyday spending categories](#f15-everyday-spending-categories): 28 dimensions
- [16 Time use & daily rhythm](#f16-time-use-daily-rhythm): 10 dimensions
- [17 Goals, values & motivations](#f17-goals-values-motivations): 12 dimensions
- [18 Decision style & trade-offs](#f18-decision-style-trade-offs): 10 dimensions
- [19 Interest intensity & participation](#f19-interest-intensity-participation): 9 dimensions
- [20 Interest domains & subtopics](#f20-interest-domains-subtopics): 32 dimensions
- [21 Leisure & lifestyle patterns](#f21-leisure-lifestyle-patterns): 9 dimensions
- [22 Food, dining & everyday preferences](#f22-food-dining-everyday-preferences): 10 dimensions
- [23 Mobility & travel behavior](#f23-mobility-travel-behavior): 11 dimensions
- [24 Accessibility & support needs](#f24-accessibility-support-needs): 11 dimensions
- [25 Product fit & sensory requirements](#f25-product-fit-sensory-requirements): 9 dimensions
- [26 Digital access & devices](#f26-digital-access-devices): 10 dimensions
- [27 Digital confidence & preferences](#f27-digital-confidence-preferences): 8 dimensions
- [28 Social platforms & communities](#f28-social-platforms-communities): 14 dimensions
- [29 Media & content consumption](#f29-media-content-consumption): 12 dimensions
- [30 Search, information & AI behavior](#f30-search-information-ai-behavior): 12 dimensions
- [31 Shopping behavior & channels](#f31-shopping-behavior-channels): 12 dimensions
- [32 Trust & perceived purchase risk](#f32-trust-perceived-purchase-risk): 8 dimensions
- [33 Buyer journey & current intent](#f33-buyer-journey-current-intent): 12 dimensions
- [34 Triggers, barriers & urgency](#f34-triggers-barriers-urgency): 9 dimensions
- [35 Payments & checkout preferences](#f35-payments-checkout-preferences): 9 dimensions
- [36 Delivery, service & usage context](#f36-delivery-service-usage-context): 10 dimensions
- [37 Customer relationship & retention](#f37-customer-relationship-retention): 10 dimensions
- [38 Professional & organizational buying roles](#f38-professional-organizational-buying-roles): 10 dimensions
- [39 Nonbuyer roles & community participation](#f39-nonbuyer-roles-community-participation): 8 dimensions
- [40 Situation, dynamics & change over time](#f40-situation-dynamics-change-over-time): 10 dimensions
- [41 Evidence, confidence & responsible use](#f41-evidence-confidence-responsible-use): 13 dimensions
- [42 Extension & composite-persona rules](#f42-extension-composite-persona-rules): 7 dimensions

## 01 Age & life stage

### P001 Age band

- Selection: Single
- Values: Under 1; 1-2; 3-5; 6-9; 10-12; 13-15; 16-17; 18-24; 25-34; 35-44; 45-54; 55-64; 65-74; 75-84; 85+
- Rule: Completed years; exhaustive age bands for this framework, not universal developmental stages. Do not infer interests.
- Ask: Which age-related design needs were actually stated?
- Scope: Person; date-specific
- Evidence: Voluntary self-report; coarse age bands preferred
- Handling: Sensitive / age safeguards
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P002 Exact age, when necessary

- Selection: Numeric
- Values: Nonnegative age in completed years; months for infants when necessary
- Rule: Avoid collecting birth date when a band is sufficient. Record reference date.
- Ask: Is exact age necessary for this service?
- Scope: Person; date-specific
- Evidence: Voluntary self-report; coarse age bands preferred
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P003 Life-stage roles

- Selection: Multiple
- Values: Child; Learner; Worker; Job seeker; Caregiver; Homemaker; Business owner; Retiree; Other self-description
- Rule: Roles may coexist and are not assigned from chronological age.
- Ask: Which roles shape the current need?
- Scope: Person; date-specific
- Evidence: Voluntary self-report; coarse age bands preferred
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P004 Independent decision-making support

- Selection: Single
- Values: Independent; Shared decisions; Supported decisions; Authorized representative
- Rule: Describe the task-specific arrangement, not intelligence or legal capacity inferred from age.
- Ask: Who needs to be involved in the decision?
- Scope: Person; date-specific
- Evidence: Voluntary self-report; coarse age bands preferred
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P005 Current life transition

- Selection: Multiple
- Values: Starting education; Graduation; First job; Career change; Moving; New partnership; Parenting; Caregiving; Retirement; None
- Rule: Ask directly; transitions may overlap or reverse.
- Ask: What recently changed?
- Scope: Person; date-specific
- Evidence: Voluntary self-report; coarse age bands preferred
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P006 Planning horizon for life goals

- Selection: Single
- Values: Today; This month; This year; 1-3 years; More than 3 years; Uncertain
- Rule: Framework bands; record the particular goal.
- Ask: How far ahead is the person planning?
- Scope: Person; date-specific
- Evidence: Voluntary self-report; coarse age bands preferred
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P007 Self-described generation or cohort

- Selection: Text
- Values: Local cohort label; No cohort identification; Self-description
- Rule: Optional cultural context only; do not apply one country's generation labels worldwide.
- Ask: Is a cohort label meaningful to the person?
- Scope: Person; date-specific
- Evidence: Voluntary self-report; coarse age bands preferred
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 02 Identity & self-description

### P008 Gender identity

- Selection: Multiple
- Values: Woman; Man; Nonbinary; Gender-fluid; Agender; Another self-description
- Rule: Optional and locally adaptable. Never infer budget, interests, family roles, or ability.
- Ask: How should the person be addressed, when relevant?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P009 Pronouns and form of address

- Selection: Text
- Values: Self-specified pronouns; Name only; Local respectful form; No preference
- Rule: Use the person's language and stated preference.
- Ask: What form of address is appropriate?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P010 Cultural or ethnic identity

- Selection: Multiple
- Values: One self-described identity; Multiple identities; Local community description; Not collected
- Rule: No globally exhaustive race or ethnicity list; preserve local and self-described categories.
- Ask: Is cultural context relevant and voluntarily provided?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P011 Nationality or citizenship context

- Selection: Multiple
- Values: One nationality; Multiple nationalities; Stateless self-description; Not collected
- Rule: Do not substitute nationality for residence, language, or culture. Avoid identity documents.
- Ask: Does a service genuinely require nationality context?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / contextual
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P012 Indigenous or local-community affiliation

- Selection: Text
- Values: Self-described affiliation; Multiple affiliations; Not collected
- Rule: Collect only for an appropriate voluntary research or service purpose; never for exclusion.
- Ask: What community-specific requirements does the person choose to share?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P013 Religion, belief, or worldview

- Selection: Multiple
- Values: Self-described tradition; Multiple traditions; Spiritual description; Nonreligious; Not collected
- Rule: Never infer from ethnicity, dress, location, or diet. Do not infer political choices.
- Ask: Are there voluntarily stated observance requirements?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P014 Sexual orientation, when relevant

- Selection: Text
- Values: Voluntary self-description; Not collected; Prefer not to say
- Rule: Restricted optional adult research context; not a general marketing field.
- Ask: Is this field genuinely necessary for the stated purpose?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P015 Identity-expression preferences

- Selection: Multiple
- Values: Private; Open in selected settings; Open broadly; Context-dependent
- Rule: Respect differences between settings; never expose private identity in messaging.
- Ask: What information should remain private?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P016 Personal self-description

- Selection: Text
- Values: Open description in the person's own words
- Rule: Preserve nuance rather than forcing a fixed persona stereotype.
- Ask: How does the person describe themselves?
- Scope: Person; voluntary
- Evidence: Self-description only; never infer from names, photos, voice, or browsing
- Handling: Sensitive / restricted
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

## 03 Geography & settlement

### P017 Country or area of residence

- Selection: Text
- Values: Any country or area; Multiple residences; No fixed residence
- Rule: Store a current country/area code plus self-description where needed; do not infer citizenship.
- Ask: In which market must the product or service work?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: UN M49 geography reference; other bands are authored. https://unstats.un.org/unsd/methodology/m49/

### P018 World region

- Selection: Multiple
- Values: Africa; Americas; Asia; Europe; Oceania; Antarctica or unassigned; Multiple regions
- Rule: Broad framework grouping; use M49 for country/area mappings rather than cultural assumptions.
- Ask: Which geographical markets are in scope?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: UN M49 geography reference; other bands are authored. https://unstats.un.org/unsd/methodology/m49/

### P019 Subregion and local area

- Selection: Text
- Values: Region; State or province; District; City or town; Broad locality
- Rule: Use only the geographical precision needed; avoid exact addresses.
- Ask: What local availability constraints matter?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: UN M49 geography reference; other bands are authored. https://unstats.un.org/unsd/methodology/m49/

### P020 Settlement type

- Selection: Single
- Values: Major city; Smaller city; Suburban area; Town; Village; Rural area; Remote settlement; Mobile
- Rule: Authored descriptors; reconcile with national definitions before comparisons.
- Ask: What service or transport access is available?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P021 Residence pattern

- Selection: Single
- Values: One stable base; Multiple bases; Seasonal residence; Frequent relocation; No fixed base
- Rule: Describes a pattern, not household wealth.
- Ask: Does the service need to work across locations?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P022 Local climate context

- Selection: Multiple
- Values: Hot; Cold; Humid; Dry; Seasonal variation; Coastal; High altitude; Other local conditions
- Rule: Record experienced conditions relevant to the use case, not stereotypes about residents.
- Ask: Which environmental conditions affect product requirements?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P023 Travel catchment

- Selection: Single
- Values: Home delivery only; Walking distance; Local town; Wider region; National; Cross-border
- Rule: Boundaries depend on the purchase or activity.
- Ask: How far can the person realistically travel?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P024 Local price environment

- Selection: Text
- Values: Local market reference; Urban/rural comparison; Dated cost-of-living source
- Rule: An area average is not personal financial capacity.
- Ask: Which local price context should a budget use?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P025 Cross-border living context

- Selection: Multiple
- Values: Lives and works in one country; Cross-border worker; Transnational household; Frequent international mobility
- Rule: Prefer practical needs over visa or immigration-status collection.
- Ask: Are language, payments, or service access cross-border?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P026 Local safety and infrastructure constraints

- Selection: Multiple
- Values: Limited lighting; Disrupted routes; Unreliable services; Seasonal access; No stated constraint
- Rule: Describe practical access needs, not dangerousness attributed to communities.
- Ask: What could prevent safe access?
- Scope: Person or household; current and historical
- Evidence: Self-report; permitted aggregate location; national statistical classifications
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 04 Language & cultural practices

### P027 Languages used

- Selection: Multiple
- Values: Any named language; Sign language; Multiple languages; Nonverbal communication
- Rule: An open vocabulary must allow every language and local variety.
- Ask: Which languages should the experience support?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P028 Preferred language by task

- Selection: Repeated
- Values: Home language; Search language; Shopping language; Work language; Support language
- Rule: Record task-language pairs; do not assume one language fits every activity.
- Ask: Which language is preferred for this task?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P029 Reading comfort

- Selection: Single
- Values: Short plain text; Everyday text; Detailed text; Technical text; Audio or assistance preferred
- Rule: Self-reported task preference, not an intelligence label.
- Ask: How much reading is comfortable?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P030 Speaking and listening comfort

- Selection: Single
- Values: Native or fluent; Conversational; Basic; Interpreter preferred; Nonverbal mode
- Rule: Record separately for each language and setting.
- Ask: Is interpretation or another communication mode useful?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P031 Writing and keyboard preference

- Selection: Multiple
- Values: Native script; Romanized script; Voice input; Handwriting; Predictive text; Assisted input
- Rule: A script preference does not imply literacy level.
- Ask: How will the person enter a query?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P032 Localization conventions

- Selection: Multiple
- Values: Local currency; Local units; Local dates; Local calendar; Local names; Address conventions
- Rule: Capture the actual conventions needed for the market.
- Ask: Which formats will feel clear and familiar?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P033 Cultural observances relevant to use

- Selection: Multiple
- Values: Festivals; Fasting periods; Community occasions; Family rituals; No stated observance
- Rule: Ask about practical requirements rather than inferring religion.
- Ask: Does timing or product suitability depend on an observance?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P034 Dietary or material observance requirements

- Selection: Text
- Values: Self-stated food, ingredient, material, or handling requirement
- Rule: Record requirements directly; beliefs need not be collected to meet them.
- Ask: Which ingredients or materials must be included or avoided?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Sensitive / contextual
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P035 Communication formality

- Selection: Single
- Values: Formal; Conversational; Highly direct; Indirect or contextual; Depends on setting
- Rule: A preference, not a national character trait.
- Ask: What communication style is preferred?
- Scope: Person; task and setting-specific
- Evidence: Self-report; language preferences and observed task needs
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 05 Household & relationships

### P036 Household composition

- Selection: Multiple
- Values: Lives alone; Couple; Parent-child household; Extended family; Multigenerational; Shared housing; Communal living
- Rule: Allow overlapping structures; do not assume marriage or biological relationships.
- Ask: Who shares the living space?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P037 Household size

- Selection: Single
- Values: 1; 2; 3; 4; 5; 6-7; 8+
- Rule: Count usual residents using a documented local definition.
- Ask: How many people must the solution serve?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P038 Relationship status, when relevant

- Selection: Multiple
- Values: Single; Partnered; Married; Separated; Divorced; Widowed; Another arrangement
- Rule: Optional; no assumptions about household composition or buying power.
- Ask: Is relationship context necessary for the use case?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P039 Household earning structure

- Selection: Single
- Values: No regular earner; One earner; Two earners; Three or more; Shared external support
- Rule: Do not equate number of earners with total resources.
- Ask: How are resources contributed?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P040 Household decision structure

- Selection: Multiple
- Values: Independent decisions; Joint decisions; Delegated decisions; Category-specific decision owner
- Rule: Roles vary by category and occasion.
- Ask: Who decides for this purchase?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P041 Household resource sharing

- Selection: Single
- Values: Fully pooled; Partly pooled; Separate budgets; Shared noncash resources; Varies
- Rule: Distinguish ownership from access.
- Ask: Which resources are actually available to this decision?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P042 Dependents supported

- Selection: Multiple
- Values: None; Children; Adult relatives; Older adults; Nonrelative dependents
- Rule: Ask directly; dependents may live elsewhere.
- Ask: Who depends on this person's time or resources?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P043 Social support availability

- Selection: Single
- Values: Reliable nearby support; Reliable remote support; Occasional support; Limited support; Self-description
- Rule: Do not use limited support to exploit vulnerability.
- Ask: What practical assistance is available?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P044 Pet or animal-care responsibilities

- Selection: Multiple
- Values: None; Dogs; Cats; Birds; Small animals; Aquatic animals; Horses; Livestock; Other
- Rule: Pets and working animals can require different care arrangements.
- Ask: Must the solution account for animal care?
- Scope: Household; current snapshot
- Evidence: Voluntary self-report; avoid names of other household members
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 06 Parenting & caregiving

### P045 Parenting or guardian role

- Selection: Multiple
- Values: Not a caregiver; Parent; Guardian; Foster caregiver; Adoptive parent; Shared caregiver; Other
- Rule: Do not infer from age, gender, marital status, or purchases.
- Ask: Is the person buying for someone in their care?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P046 Dependent age groups

- Selection: Multiple
- Values: Under 1; 1-2; 3-5; 6-12; 13-17; Adult; Older adult
- Rule: Use coarse bands; avoid identifying children.
- Ask: Which age-related support needs have been stated?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P047 Caregiving intensity

- Selection: Single
- Values: Occasional; Several times weekly; Daily part-time; Daily substantial care; Continuous availability
- Rule: Authored categories; actual hours may be recorded voluntarily.
- Ask: How much time does care occupy?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P048 Care arrangement

- Selection: Multiple
- Values: Household care; Shared family care; Paid home care; Daycare; School-based care; Residential care
- Rule: Availability differs by location; no preferred arrangement is assumed.
- Ask: What arrangement must the product fit?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P049 Caregiving location

- Selection: Multiple
- Values: Same home; Nearby household; Long-distance; Multiple locations
- Rule: Do not collect another person's exact address.
- Ask: Is remote coordination necessary?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P050 Care logistics

- Selection: Multiple
- Values: Transport; Scheduling; Meals; Learning support; Mobility support; Supervision; Administration
- Rule: Describe tasks, not diagnoses of dependents.
- Ask: Which recurring task is difficult?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P051 Child-related product constraints

- Selection: Multiple
- Values: Child-seat fit; Stroller space; Age suitability; Washability; Simple storage; No stated constraint
- Rule: Apply only to explicit needs; not every parent needs every feature.
- Ask: What must fit or work in everyday use?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P052 Care purchase role

- Selection: Multiple
- Values: Researcher; Payer; Buyer; End user; Installer; Care coordinator
- Rule: Buying and using may involve different people.
- Ask: Who evaluates, pays for, and uses the product?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P053 Care support gap

- Selection: Text
- Values: Self-described unmet practical need; No stated gap
- Rule: Use to improve access, not fear-based selling.
- Ask: What support would make this task easier?
- Scope: Care role; dependent and task-specific
- Evidence: Voluntary report of practical care needs
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 07 Housing & living environment

### P054 Housing tenure

- Selection: Single
- Values: Owner with loan; Owner without loan; Renter; Family-provided; Employer-provided; Collective housing; Temporary housing
- Rule: Tenure is not a direct measure of wealth.
- Ask: Who can authorize home changes?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P055 Dwelling form

- Selection: Single
- Values: Detached home; Attached home; Apartment; Room; Dormitory; Mobile dwelling; Informal dwelling; Other
- Rule: Allow locally specific housing types.
- Ask: What physical setting must the solution fit?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P056 Space availability

- Selection: Multiple
- Values: Very limited storage; Shared rooms; Dedicated workspace; Outdoor space; Workshop space; Ample storage
- Rule: Prefer usable space or measurements over status labels.
- Ask: What can physically fit?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P057 Household facilities

- Selection: Multiple
- Values: Kitchen access; Laundry access; Indoor water; Cooling; Heating; Private bathroom; Shared facilities
- Rule: Record availability rather than assuming household standards.
- Ask: Which facilities can the person use?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P058 Electricity reliability

- Selection: Single
- Values: Reliable; Occasional outages; Frequent outages; Off-grid; No electricity access
- Rule: Infrastructure condition, not a personal trait.
- Ask: Is offline or low-power operation needed?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P059 Water and sanitation access

- Selection: Multiple
- Values: In-home access; Shared access; Collected water; Intermittent supply; Other arrangement
- Rule: For service and design needs only; do not stigmatize.
- Ask: Does the solution depend on reliable water?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P060 Home connectivity constraints

- Selection: Multiple
- Values: Strong coverage; Weak coverage; Shared connection; Data cap; No home internet
- Rule: Separate availability from ability to pay.
- Ask: Does the solution need an offline option?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P061 Home modification authority

- Selection: Single
- Values: Can modify; Permission required; Temporary changes only; Cannot modify
- Rule: Ask separately from ownership status.
- Ask: Is permanent installation possible?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P062 Residential stability

- Selection: Single
- Values: Stable expected stay; Lease ending; Move planned; Temporary accommodation; Uncertain
- Rule: Sensitive context; not a predictor of reliability or creditworthiness.
- Ask: Does the solution need to be portable?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P063 Home service preference

- Selection: Multiple
- Values: Do it myself; Hire a specialist; Shared community help; Managed service; Mixed
- Rule: Depends on task, skills, cost, and time.
- Ask: Which tasks should be self-service?
- Scope: Household; current home context
- Evidence: Self-report; nonidentifying observations
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

## 08 Education & skills

### P064 Educational attainment

- Selection: Multiple
- Values: No formal schooling; Primary; Secondary; Vocational; Short-cycle tertiary; Bachelor's level; Master's level; Doctoral level; Other
- Rule: Authored broad labels; map local credentials before international comparisons. Not an intelligence proxy.
- Ask: What knowledge can the material reasonably build on?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P065 Current learning participation

- Selection: Multiple
- Values: School; University; Apprenticeship; Professional training; Informal learning; Self-study; None
- Rule: Learning may be formal or informal and occur at any age.
- Ask: What is the person currently learning?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P066 Field of study

- Selection: Multiple
- Values: Education; Arts and humanities; Social sciences; Business; Law; Science; Technology; Engineering; Health; Agriculture; Services; Other
- Rule: Broad authored categories; allow local specialties and multidisciplinary study.
- Ask: Which subject context matters?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P067 Professional qualifications

- Selection: Text
- Values: Named credential; Local license; Trade certification; Portfolio evidence; None
- Rule: Record jurisdiction and relevance; do not assume equivalence worldwide.
- Ask: Is a specific credential needed for this role?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P068 Category knowledge

- Selection: Single
- Values: New to the category; Basic familiarity; Experienced user; Specialist; Expert practitioner
- Rule: Assess for the product or topic, not as a global label.
- Ask: Should the explanation start with basics?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P069 Practical and technical skills

- Selection: Multiple
- Values: Repair; Craft; Coding; Data work; Design; Writing; Languages; Trades; Research; Other
- Rule: Self-report or task evidence; not predicted from education.
- Ask: Which tasks can the person complete unaided?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P070 Learning format preference

- Selection: Multiple
- Values: Reading; Audio; Video; Demonstration; Hands-on practice; Live instruction; Peer learning
- Rule: Preferences are not fixed learning-style diagnoses.
- Ask: Which formats should be available?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P071 Learning time availability

- Selection: Single
- Values: Under 15 minutes; 15-30 minutes; 31-60 minutes; 1-3 hours; More than 3 hours per session
- Rule: Authored session bands; separate preference from actual availability.
- Ask: How much time is available to learn?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P072 Learning goal

- Selection: Multiple
- Values: Qualification; Career change; Skill improvement; Personal interest; Practical problem; Social connection
- Rule: Goals may be combined.
- Ask: What would successful learning enable?
- Scope: Person; subject and task-specific
- Evidence: Self-report; credentials only when needed; direct skills evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 09 Work & livelihood

### P073 Livelihood roles

- Selection: Multiple
- Values: Employee; Self-employed; Business owner; Freelancer; Gig worker; Subsistence producer; Unpaid family worker; Student; Retiree; Job seeker
- Rule: People may have multiple jobs and unpaid roles; no income assumption.
- Ask: Which work activities shape the need?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P074 Occupation or trade

- Selection: Text
- Values: Any local occupation; Multiple occupations; Nonemployment role
- Rule: Preserve local job titles; use a documented occupational code when comparing datasets.
- Ask: What tasks does the person perform?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P075 Sector or industry

- Selection: Multiple
- Values: Agriculture; Manufacturing; Construction; Trade; Transport; Hospitality; Technology; Finance; Education; Health; Public services; Other
- Rule: Authored broad labels, not an official industry-code mapping.
- Ask: Which sector-specific context matters?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P076 Employment arrangement

- Selection: Multiple
- Values: Permanent; Fixed-term; Temporary; Seasonal; Casual; On-demand; Informal; Own enterprise
- Rule: Terms differ by jurisdiction and may coexist.
- Ask: How predictable is the work arrangement?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P077 Work location

- Selection: Multiple
- Values: On-site; Remote home-based; Hybrid; Mobile or field-based; Multiple sites
- Rule: Do not infer occupation or income from working remotely.
- Ask: Where must the solution function?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P078 Working schedule

- Selection: Multiple
- Values: Regular daytime; Night shift; Rotating shifts; Flexible hours; On-call; Seasonal peaks
- Rule: Record timezone and practical availability when relevant.
- Ask: When can the person research or use the service?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P079 Career stage

- Selection: Single
- Values: Exploring entry; Early career; Established contributor; Management; Leadership; Career transition; Leaving paid work
- Rule: Do not derive career stage from age.
- Ask: What career problem is being addressed?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P080 Job security perception

- Selection: Single
- Values: Secure; Some uncertainty; Highly uncertain; Contract ending; Not applicable
- Rule: Voluntary self-perception; not a risk score for exclusion.
- Ask: Is flexibility or a shorter commitment important?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P081 Entrepreneurship stage

- Selection: Single
- Values: Considering; Starting; Operating; Expanding; Maintaining; Exiting; Not applicable
- Rule: Separate business stage from business size.
- Ask: Which business-building task is current?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P082 Work-related physical demands

- Selection: Multiple
- Values: Mostly seated; Standing; Walking; Lifting; Outdoor exposure; Travel; Mixed
- Rule: Record tasks and stated accommodations rather than medical diagnoses.
- Ask: What ergonomic or durability needs arise?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P083 Compensation structure

- Selection: Multiple
- Values: Salary; Hourly pay; Commission; Piece rate; Business profit; Tips; In-kind; Unpaid
- Rule: Income structure is different from total income.
- Ask: Is income timing predictable?
- Scope: Person; current jobs and unpaid work
- Evidence: Self-report; distinguish role, work arrangement, and income
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

## 10 Income & financial position

### P084 Personal income amount

- Selection: Numeric
- Values: Local-currency amount; Zero; Negative net business income when relevant
- Rule: State gross/net, period, reference date, and included sources; never mix annual and monthly figures.
- Ask: Which income definition is relevant?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P085 Household income amount

- Selection: Numeric
- Values: Combined household amount in local currency
- Rule: Define household membership, gross/net basis, period, and shared resources.
- Ask: How much income is pooled for this household?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P086 Local income position

- Selection: Single
- Values: Q1 lowest 20%; Q2; Q3; Q4; Q5 highest 20%; Not benchmarked
- Rule: Requires a dated comparable local distribution and matching household/person basis. Not a world class label.
- Ask: Where does income fall within the chosen reference population?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P087 Income sources

- Selection: Multiple
- Values: Employment; Self-employment; Pension; Investments; Rent; Transfers; Remittances; Benefits; In-kind; Other
- Rule: Source does not imply amount or stability.
- Ask: Which resources support this person?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P088 Income regularity

- Selection: Single
- Values: Predictable monthly; Predictable other cycle; Seasonal; Variable; Irregular; No current income
- Rule: Specify a reference period.
- Ask: Would variable payment timing help?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P089 Disposable-resource headroom

- Selection: Single
- Values: Essentials not fully covered; Essentials covered only; Some discretionary room; Substantial discretionary room; Uncertain
- Rule: Self-reported resource position; not an official poverty or class threshold.
- Ask: How much flexibility remains after essentials?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P090 Self-described financial class

- Selection: Text
- Values: Financially constrained; Working-class self-description; Middle-class self-description; Affluent self-description; Other local term
- Rule: Subjective identity, not a globally comparable numeric segment. Keep separate from income quintile.
- Ask: How does the person describe financial position?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P091 Financial obligations supported

- Selection: Multiple
- Values: Own living costs; Household costs; Child support; Relatives; Education; Business obligations; Cross-border support
- Rule: Ask only what is needed; do not collect recipients' identities.
- Ask: Which commitments constrain discretionary spending?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P092 Household-adjusted comparison basis

- Selection: Text
- Values: Household size; Equivalence method; Income definition; Reference population
- Rule: No adjustment is applied automatically; document the method before comparing households.
- Ask: Are the two resource figures actually comparable?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P093 Cross-country comparison basis

- Selection: Text
- Values: Local currency and date; Price level reference; Suitable PPP series and year; No comparison
- Rule: PPP is not a retail exchange rate or exact personal cost-of-living estimate. Match series to purpose.
- Ask: Should this comparison use local purchasing power rather than dollar conversion?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: World Bank PPP concept reference. No PPP values or global income cutoffs supplied. https://databank.worldbank.org/metadataglossary/world-development-indicators/series/PA.NUS.PPP

### P094 Financial outlook

- Selection: Single
- Values: Resources expected to improve; Stay similar; Decline; Highly uncertain
- Rule: Self-reported expectation, not a forecast.
- Ask: Is a long commitment comfortable?
- Scope: Person or household; currency and period required
- Evidence: Voluntary amounts or local statistical bands; never infer from identity
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 11 Wealth, liquidity & resilience

### P095 Net-asset position

- Selection: Single
- Values: Liabilities exceed assets; Approximately balanced; Positive net assets; Not measured
- Rule: Define included assets, liabilities, valuation date, and ownership share.
- Ask: Is wealth distinct from current cash availability?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P096 Liquid-resource availability

- Selection: Single
- Values: No accessible reserve; Limited reserve; Moderate reserve; Large reserve; Uncertain
- Rule: Qualitative bands are self-described; do not imply numeric thresholds.
- Ask: Can an unexpected expense be absorbed?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P097 Emergency reserve duration

- Selection: Single
- Values: None; Under 1 month; 1 to under 3 months; 3 to under 6; 6 to under 12; 12+ months
- Rule: Authored bands of stated essential expenses; not financial advice or a recommended reserve.
- Ask: How much flexibility is available in a disruption?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P098 Asset mix

- Selection: Multiple
- Values: Cash; Property; Business assets; Financial assets; Land; Equipment; Valuables; Other
- Rule: Record broad types only; ownership does not guarantee liquidity.
- Ask: Which resources are usable versus illiquid?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P099 Debt categories

- Selection: Multiple
- Values: None reported; Housing; Education; Vehicle; Consumer; Business; Informal borrowing; Other
- Rule: No account numbers, credit scoring, or affordability determination.
- Ask: Which existing commitments affect the stated budget?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P100 Debt payment pressure

- Selection: Single
- Values: Easily manageable; Manageable with trade-offs; Difficult; Unable to meet some payments; Not stated
- Rule: Self-report; never use hardship to pressure a purchase.
- Ask: Is a lower-commitment option needed?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P101 Financial support access

- Selection: Multiple
- Values: Household support; Extended family; Community support; Formal assistance; No available support
- Rule: Availability does not mean the person wants or qualifies for a product.
- Ask: What support is already part of the person's plan?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P102 Financial priorities

- Selection: Multiple
- Values: Meet essentials; Build reserve; Reduce debt; Education; Home; Retirement; Business; Experiences; Giving
- Rule: Record current priorities, not investment recommendations.
- Ask: What is this purchase competing with?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P103 Risk capacity versus preference

- Selection: Repeated
- Values: Stated ability to absorb loss; Stated comfort with uncertainty; Not assessed
- Rule: Keep ability and preference separate; not a suitability or credit assessment.
- Ask: Is the person's comfort different from their available resources?
- Scope: Person or household; voluntary snapshot
- Evidence: Self-report in broad bands; no account identifiers
- Handling: Sensitive / restricted
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 12 Purchase budget & affordability context

### P104 Budget currency

- Selection: Text
- Values: Any local currency code; Multiple currencies with stated conversion date
- Rule: Every monetary amount needs a currency. No automatic exchange or purchasing-power conversion.
- Ask: In which currency is this budget?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P105 Budget period and unit

- Selection: Single
- Values: Per item; Per purchase; Per month; Per year; Per trip; Per person; Per household; Per project
- Rule: A monthly ceiling cannot be compared directly with a one-time price.
- Ask: What does the budget cover?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P106 Minimum acceptable spend

- Selection: Numeric
- Values: Zero or positive local-currency amount; No minimum
- Rule: Optional stated lower bound, not assumed from income.
- Ask: Is there a minimum quality or specification requirement?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P107 Target spend

- Selection: Numeric
- Values: Stated preferred local-currency amount; Not yet decided
- Rule: A target is different from a maximum or a market price.
- Ask: What amount would feel comfortable?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P108 Maximum spend

- Selection: Numeric
- Values: Stated all-in ceiling; No fixed ceiling; Not yet decided
- Rule: Ask whether taxes, fees, delivery, installation, and ongoing costs are included.
- Ask: What is the maximum total commitment?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P109 Budget flexibility

- Selection: Single
- Values: Fixed ceiling; Small flexibility; Flexible for proven value; Open budget; Unknown
- Rule: Qualitative self-report; do not invent a percentage premium.
- Ask: What would justify spending more?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P110 Budget tier within the category

- Selection: Single
- Values: Below P20; P20 to below P40; P40 to below P60; P60 to below P80; P80+; Not benchmarked
- Rule: Authored tiers require a dated local category-price distribution. They do not define financial class.
- Ask: Is the budget entry-level or high-end for this particular market?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P111 Spend as share of available resources

- Selection: Single
- Values: 0%; Above 0 to under 1%; 1 to under 5%; 5 to under 10%; 10 to under 25%; 25 to under 50%; 50%+
- Rule: Illustrative analytical bands; match numerator and denominator periods. Not an affordability verdict.
- Ask: How significant is this purchase in the stated budget?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P112 Upfront versus recurring preference

- Selection: Single
- Values: Upfront preferred; Recurring preferred; Either; No recurring commitments
- Rule: Preference does not establish qualification for credit.
- Ask: Is the total price or monthly commitment the relevant constraint?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P113 Total ownership-cost sensitivity

- Selection: Scale
- Values: Not important; Slightly important; Moderately important; Very important; Essential
- Rule: Ask directly about maintenance, energy, supplies, subscriptions, and exit costs.
- Ask: Which ongoing costs belong in the comparison?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P114 Budget funding source

- Selection: Multiple
- Values: Current income; Savings; Household contribution; Employer funding; Gift; Borrowing considered; Other
- Rule: Record plans without recommending borrowing or inferring approval.
- Ask: Who is funding the purchase?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P115 Purchase deferral ability

- Selection: Single
- Values: Can postpone indefinitely; Can wait months; Can wait weeks; Must act soon; Urgent replacement
- Rule: Urgency must be stated; do not manufacture pressure.
- Ask: Can the purchase wait?
- Scope: One category, purchase, and market at a time
- Evidence: Explicit budget or observed transaction data with permission
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 13 Price, value & luxury preferences

### P116 Price orientation

- Selection: Single
- Values: Lowest workable price; Value for money; Balanced price and features; Premium preferred; Price secondary
- Rule: Keep separate from wealth, income, and gender.
- Ask: What does good value mean for this purchase?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P117 Luxury orientation

- Selection: Multiple
- Values: No luxury interest; Occasional splurge; Luxury in selected categories; Routine luxury preference; Bespoke interest; Collector interest
- Rule: Self-described category preference, not a class or personality assignment.
- Ask: Where does the person choose to spend on luxury?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P118 Luxury value sought

- Selection: Multiple
- Values: Craftsmanship; Materials; Design; Heritage; Exclusivity; Personal service; Performance; Experience; Resale interest
- Rule: Do not assume luxury is primarily about status.
- Ask: Which premium attribute matters?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P119 Brand visibility preference

- Selection: Single
- Values: No visible branding; Subtle branding; Prominent branding; No preference; Varies by occasion
- Rule: A style choice, not evidence of financial position.
- Ask: Should branding be discreet or visible?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P120 Functional versus symbolic value

- Selection: Single
- Values: Function mainly; Symbolic meaning mainly; Both; Depends on category
- Rule: Ask about actual meaning; do not infer from demographics.
- Ask: Is the purchase serving a practical or expressive goal?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P121 Craft and customization preference

- Selection: Multiple
- Values: Standard product; Configurable; Personalized; Made-to-measure; Bespoke; Handmade
- Rule: Preference does not imply ability to pay.
- Ask: How much customization is useful?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P122 Scarcity and collectibility interest

- Selection: Scale
- Values: None; Low; Moderate; High; Specialist collector
- Rule: Interest is not a prediction of resale value.
- Ask: Does edition, provenance, or collectibility matter?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P123 Service tier preference

- Selection: Multiple
- Values: Self-service; Standard assistance; Specialist advice; Concierge; White-glove support
- Rule: May be driven by access needs or time, not wealth.
- Ask: What level of support is wanted?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P124 Ownership visibility

- Selection: Single
- Values: Private use; Shared household use; Social display; Professional presentation; Mixed
- Rule: Context is voluntarily stated and category-specific.
- Ask: Who will see or use the purchase?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P125 Premium trade-off tolerance

- Selection: Multiple
- Values: Higher upfront price; Longer wait; Higher upkeep; Specialist servicing; None of these
- Rule: Capture actual trade-offs, not inferred willingness to pay.
- Ask: Which premium trade-offs are acceptable?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P126 Price-quality belief

- Selection: Single
- Values: Checks evidence independently; Often associates price with quality; Skeptical of premiums; Context-dependent
- Rule: Treat as a self-reported belief, not an objective truth.
- Ask: What evidence would justify a premium?
- Scope: Preference for a particular category or occasion
- Evidence: Direct preference questions; stated trade-offs; observed choices when permitted
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 14 Spending patterns & allocation

### P127 Total consumption amount

- Selection: Numeric
- Values: Nonnegative local-currency total for a defined period
- Rule: Define included purchases and household members; avoid double-counting shared expenses.
- Ask: What does the spending total include?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P128 Category spending profile

- Selection: Repeated
- Values: Category; Amount; Currency; Period; Share of total; Observed or planned
- Rule: Repeat for each category. Planned budget and actual spending must be separate.
- Ask: Where is money actually being spent?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P129 Purchase frequency

- Selection: Single
- Values: Daily; Several times weekly; Weekly; Monthly; Quarterly; Annually; Less often; One-off
- Rule: Measure within a category and reference period.
- Ask: How often is this purchased?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P130 Average transaction size

- Selection: Numeric
- Values: Local-currency average plus observation count and period
- Rule: Do not confuse one large purchase with typical spending.
- Ask: What is the typical purchase amount?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P131 Essentials versus discretionary allocation

- Selection: Repeated
- Values: Self-defined essential; Discretionary; Mixed; Unclassified
- Rule: Necessity depends on circumstances; do not impose one universal list.
- Ask: Which spending can realistically be changed?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P132 Planned versus unplanned spending

- Selection: Single
- Values: Mostly planned; Mixed; Mostly unplanned; Not measured
- Rule: Use a diary or explicit report; do not diagnose impulse-control conditions.
- Ask: Does the person prefer to plan purchases?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P133 Seasonal spending pattern

- Selection: Multiple
- Values: Stable year-round; Festival peaks; School cycle; Travel season; Weather season; Business cycle; Other
- Rule: Local calendars and income cycles differ.
- Ask: When do category needs increase?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P134 Spending beneficiary

- Selection: Multiple
- Values: Self; Household; Children; Other relatives; Friends; Community; Employer or business
- Rule: The buyer is not necessarily the user.
- Ask: Who benefits from the spending?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P135 Spending change

- Selection: Single
- Values: Increasing; Stable; Decreasing; Newly started; Stopped; Not measured
- Rule: Specify category, comparison period, and price changes.
- Ask: Has the spending pattern changed recently?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P136 Cash and informal spending visibility

- Selection: Single
- Values: Mostly recorded; Partly recorded; Mostly unrecorded; Unknown
- Rule: Missing transaction data is not zero spending.
- Ask: Which cash or informal transactions are missing?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P137 Financial flows outside consumption

- Selection: Multiple
- Values: Savings; Investments; Loan principal; Taxes; Transfers; Gifts of money; Business capital
- Rule: Track separately from consumption; distinguish financing from purchases to avoid double-counting.
- Ask: Is this an expense or a movement of funds?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P138 Spending decision autonomy

- Selection: Single
- Values: Full control; Shared control; Approval required; Restricted category allowance
- Rule: Task-specific; do not infer from gender, age, or household role.
- Ask: Who authorizes spending?
- Scope: Person or household; category and reference period
- Evidence: Voluntary spending diary or consented transaction summaries
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

## 15 Everyday spending categories

### P139 Food and nonalcoholic drinks

- Selection: Multiple
- Values: Staples; Fresh produce; Prepared groceries; Snacks; Water; Nonalcoholic drinks; Special-diet groceries
- Rule: Separate groceries from restaurant services; use local subcategories.
- Ask: What matters most in everyday food spending?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P140 Housing and shelter

- Selection: Multiple
- Values: Rent; Housing service costs; Repairs; Shared accommodation fees; Temporary lodging
- Rule: Separate asset purchases and loan principal from consumption; maintain local accounting definitions.
- Ask: Which housing costs constrain the budget?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P141 Utilities and household energy

- Selection: Multiple
- Values: Electricity; Cooking fuel; Heating fuel; Water; Waste services; Shared utility fees
- Rule: Record actual availability and payer.
- Ask: Which utility costs matter?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P142 Clothing and footwear

- Selection: Multiple
- Values: Everyday clothing; Workwear; Occasion wear; Footwear; Alterations; Repair; Rental
- Rule: Style and functional needs are independent from gender.
- Ask: Is fit, durability, price, or expression most important?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P143 Household goods and appliances

- Selection: Multiple
- Values: Furniture; Kitchenware; Appliances; Bedding; Cleaning goods; Tools
- Rule: Distinguish new ownership, replacement, and repair.
- Ask: Is the purchase necessary, optional, or a replacement?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P144 Domestic services

- Selection: Multiple
- Values: Cleaning; Laundry; Cooking help; Gardening; Maintenance; Household management
- Rule: Service use may reflect time or accessibility needs, not status.
- Ask: Which household task should be outsourced?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P145 Health-related expenses

- Selection: Multiple
- Values: Routine care; Dental; Vision; Medicines; Assistive products; Therapy; Preventive services
- Rule: Restricted voluntary context; do not infer diagnoses or target hardship.
- Ask: What access or payment constraints should the service accommodate?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P146 Ground transport

- Selection: Multiple
- Values: Public transit; Taxi; Ride services; Fuel; Parking; Tolls; Bicycle costs; Vehicle upkeep
- Rule: Separate vehicle acquisition from ongoing operation.
- Ask: What does everyday mobility cost?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P147 Vehicle acquisition and access

- Selection: Multiple
- Values: Purchase; Lease; Rental; Shared vehicle; Subscription; Borrowed access; No vehicle
- Rule: Do not equate owning a vehicle with needing another.
- Ask: Does the person need ownership or just access?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P148 Travel and accommodation

- Selection: Multiple
- Values: Local trips; Domestic trips; International trips; Accommodation; Package travel; Travel support
- Rule: Record purpose, party size, timing, and local currency.
- Ask: What travel experience is being funded?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P149 Dining and food services

- Selection: Multiple
- Values: Cafes; Casual dining; Fine dining; Takeaway; Delivery; Catering; Work meals
- Rule: Separate actual spending from cuisine interests.
- Ask: Is convenience, experience, or price the priority?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P150 Communication and connectivity

- Selection: Multiple
- Values: Mobile plan; Home internet; Data top-ups; Shared connectivity; Calling services; Postal services
- Rule: Account for prepaid and shared access.
- Ask: What connectivity commitment is manageable?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P151 Devices and consumer technology

- Selection: Multiple
- Values: Phones; Computers; Tablets; Wearables; Audio; Cameras; Accessories; Repair
- Rule: Distinguish access, ownership, and upgrade interest.
- Ask: Is a device purchase solving a specific limitation?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P152 Software and digital services

- Selection: Multiple
- Values: Productivity; Storage; Creative tools; Security; AI tools; Gaming services; Other
- Rule: Record recurring costs, renewal terms, and actual use.
- Ask: Which subscription remains useful?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P153 Entertainment and culture

- Selection: Multiple
- Values: Cinema; Streaming; Music; Live shows; Museums; Books; Digital media
- Rule: Digital and offline consumption may coexist.
- Ask: What entertainment is worth paying for?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P154 Sport and recreation

- Selection: Multiple
- Values: Memberships; Classes; Equipment; Event entry; Outdoor activities; Facility access
- Rule: Do not infer participation from viewing sports content.
- Ask: Is the person paying to participate, watch, or both?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P155 Education and training

- Selection: Multiple
- Values: School fees; Tuition; Tutoring; Courses; Credentials; Learning materials; Workshops
- Rule: May be for self or dependents; record beneficiary.
- Ask: What outcome should the education spending achieve?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P156 Personal care and grooming

- Selection: Multiple
- Values: Toiletries; Haircare; Skincare; Grooming; Salon services; Cosmetics
- Rule: Self-stated needs only; no gendered spending assumptions.
- Ask: Which personal-care benefits matter?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P157 Caregiving and social-support services

- Selection: Multiple
- Values: Childcare; Elder support; Respite; Home assistance; Supported living; Other
- Rule: Sensitive service needs; no diagnosis required for a spending category.
- Ask: What care support is needed?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P158 Insurance and financial-service fees

- Selection: Multiple
- Values: Insurance premiums; Account fees; Payment fees; Advisory fees; Other service charges
- Rule: Do not mix premiums or fees with investment principal or claims.
- Ask: Which services are actually being paid for?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P159 Pet and animal care

- Selection: Multiple
- Values: Food; Veterinary services; Grooming; Boarding; Equipment; Training; Working-animal care
- Rule: Record type of animal and purpose only when relevant.
- Ask: What care or travel constraints are involved?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P160 Home improvement and equipment

- Selection: Multiple
- Values: Renovation; Tools; Energy upgrades; Security equipment; Decor; Landscaping
- Rule: Capital improvements may sit outside consumption measures; avoid double-counting.
- Ask: Is the project maintenance or an upgrade?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P161 Celebrations and gifts

- Selection: Multiple
- Values: Birthdays; Weddings; Festivals; Anniversaries; Hospitality; Gifts; Other occasions
- Rule: A cross-category occasion tag; do not add again to category totals.
- Ask: What occasion and recipient shape the choice?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P162 Luxury and collectibles spending

- Selection: Multiple
- Values: Fashion; Jewelry; Watches; Art; Design objects; Vehicles; Experiences; Other
- Rule: Cross-category preference tag, not an additional expense division.
- Ask: In which category is a premium intentionally chosen?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P163 Community support and giving

- Selection: Multiple
- Values: Donations; Mutual aid; Community projects; Membership contributions; Volunteering expenses
- Rule: Cash transfers differ from purchased goods and services.
- Ask: Is support financial, practical, or both?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P164 Professional and business purchases

- Selection: Multiple
- Values: Tools; Software; Equipment; Work travel; Training; Office costs; Supplies
- Rule: Keep business and personal spending separate; identify reimbursement.
- Ask: Is the person buying for work or household use?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P165 Agriculture and livelihood inputs

- Selection: Multiple
- Values: Seeds; Feed; Equipment; Repairs; Storage; Irrigation; Market access; Other
- Rule: Business inputs and own-use production need separate accounting.
- Ask: Is the purchase for livelihood production?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P166 Regulated adult categories

- Selection: Multiple
- Values: Lawful adult-category spending; None; Not collected
- Rule: Aggregate only where necessary and lawful; do not use for minor profiling or infer dependency.
- Ask: Is an aggregate category necessary for the research purpose?
- Scope: Repeat amount, period, importance, and tier for each category
- Evidence: Self-report or permitted spending records; zero is a valid amount
- Handling: Sensitive / contextual
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

## 16 Time use & daily rhythm

### P167 Daily activity mix

- Selection: Multiple
- Values: Paid work; Own-use production; Domestic tasks; Caregiving; Learning; Volunteering; Socializing; Leisure; Personal care
- Rule: Inspired by time-use classification; proportions require actual observations.
- Ask: Which activities occupy the day?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P168 Work and study hours

- Selection: Numeric
- Values: Hours per day or week; Zero when applicable
- Rule: State period and include only defined activities.
- Ask: How much time remains outside work or study?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P169 Unpaid household-work load

- Selection: Single
- Values: None; Low; Moderate; High; Highly variable
- Rule: Self-defined bands; no gender assumptions.
- Ask: Which routine task consumes time?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P170 Discretionary time availability

- Selection: Single
- Values: Very limited; Short occasional gaps; Regular short periods; Regular long periods; Highly variable
- Rule: Distinguish available time from desired time.
- Ask: How much attention can the person give now?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P171 Preferred active hours

- Selection: Multiple
- Values: Early morning; Morning; Afternoon; Evening; Late night; Variable
- Rule: Use local time; do not infer from age or occupation.
- Ask: When is interaction convenient?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P172 Routine predictability

- Selection: Single
- Values: Highly regular; Somewhat regular; Frequently changing; Event-driven
- Rule: Timing preferences need periodic refresh.
- Ask: Should reminders or appointments be flexible?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P173 Multitasking context

- Selection: Multiple
- Values: Focused session; During commute; While caring; During breaks; Background listening; Other
- Rule: Design for interruption; do not infer low engagement from context.
- Ask: Can the activity be paused and resumed?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P174 Time-saving preference

- Selection: Scale
- Values: Not important; Slightly important; Moderately important; Very important; Essential
- Rule: Record willingness to trade effort or money for convenience separately.
- Ask: Which step should be simplified?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P175 Social and leisure time

- Selection: Repeated
- Values: Activity; Hours; Frequency; Companions; Setting
- Rule: Record chosen activities rather than imposing a lifestyle label.
- Ask: How does the person choose to spend free time?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

### P176 Calendar constraints

- Selection: Multiple
- Values: Work deadlines; School calendar; Care schedules; Community events; Religious observances; Travel; None
- Rule: Only self-stated constraints; protect sensitive observance information.
- Ask: Which dates or periods must be avoided?
- Scope: Person; dated day or week
- Evidence: Time diary or voluntary report; distinguish simultaneous activities
- Handling: Personal / minimize
- Basis: Time-use reference: ICATUS 2016. Persona bands are authored. https://unstats.un.org/unsd/demographic-social/time-use/icatus-2016/

## 17 Goals, values & motivations

### P177 Primary life priorities

- Selection: Multiple
- Values: Security; Family; Relationships; Health; Learning; Career; Independence; Creativity; Adventure; Community; Other
- Rule: Priorities can coexist, conflict, and change.
- Ask: What is most important right now?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P178 Functional outcome sought

- Selection: Text
- Values: Practical task completed; Problem removed; Capability gained; Time saved; Other outcome
- Rule: Describe a concrete desired outcome rather than a demographic label.
- Ask: What should this help the person do?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P179 Emotional outcome sought

- Selection: Multiple
- Values: Reassurance; Enjoyment; Confidence; Calm; Pride; Belonging; Relief; Other
- Rule: Voluntary self-description, not hidden-state inference or manipulation.
- Ask: How does the person hope to feel afterward?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P180 Social outcome sought

- Selection: Multiple
- Values: Connect; Collaborate; Support family; Express identity; Participate; Be recognized; No social goal
- Rule: Do not equate social expression with status seeking.
- Ask: Does the choice affect social participation?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P181 Autonomy preference

- Selection: Single
- Values: Independent control; Guidance welcome; Shared decisions; Delegation preferred; Depends on task
- Rule: Capability and preference are separate.
- Ask: How much control does the person want?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P182 Novelty preference

- Selection: Single
- Values: Familiar options; Proven improvements; Mix of familiar and new; New experiences preferred
- Rule: Task-specific preference, not an age-based trait.
- Ask: Is novelty a benefit or a concern?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P183 Sustainability priorities

- Selection: Multiple
- Values: Durability; Repairability; Reuse; Energy use; Packaging; Materials; Local impact; No stated priority
- Rule: Stated values and observed spending must be recorded separately.
- Ask: Which sustainability attribute affects the decision?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P184 Ethical purchasing priorities

- Selection: Multiple
- Values: Labor practices; Animal welfare; Supply transparency; Local livelihoods; Community impact; Other
- Rule: Record stated criteria without inferring ideology or judging choices.
- Ask: What sourcing evidence is important?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P185 Convenience versus control

- Selection: Single
- Values: Maximum convenience; Maximum control; Balanced; Task-dependent
- Rule: Do not assume a universal preference across categories.
- Ask: Should this be automated or configurable?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P186 Possessions versus experiences

- Selection: Single
- Values: Possessions prioritized; Experiences prioritized; Balanced; Category-dependent
- Rule: Neither implies a particular income class.
- Ask: Where does discretionary value come from?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P187 Long-term aspirations

- Selection: Text
- Values: Self-described education, family, work, home, creative, or lifestyle goal
- Rule: Record aspirations as statements, not predicted outcomes.
- Ask: What future goal does this decision support?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P188 Unacceptable trade-offs

- Selection: Multiple
- Values: Budget overrun; Privacy loss; Time burden; Poor fit; Reliability concerns; Maintenance burden; Other
- Rule: Let people state their own limits.
- Ask: What would rule out an option immediately?
- Scope: Person; goal and situation-specific
- Evidence: Direct questions, interviews, and voluntary ranking; never inferred identity
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 18 Decision style & trade-offs

### P189 Decision pace

- Selection: Single
- Values: Immediate; Same day; Several days; Weeks; Months; No deadline
- Rule: Measure for the current decision; not a stable trait.
- Ask: How much deliberation time is expected?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P190 Research depth

- Selection: Single
- Values: Minimal; A few checks; Several comparisons; Extensive research; Specialist assessment
- Rule: Not an intelligence or sophistication ranking.
- Ask: How much supporting detail is useful?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P191 Choice-set preference

- Selection: Single
- Values: One strong option; Small shortlist; Broad choice; Full catalog; Guidance needed
- Rule: Preference may change with category knowledge.
- Ask: How many alternatives should be presented?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P192 Decision criteria importance

- Selection: Repeated
- Values: Criterion; Importance; Evidence needed; Deal-breaker status
- Rule: Use explicit weights only when supplied or elicited; do not invent scores.
- Ask: Which criteria matter most?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P193 Evidence preference

- Selection: Multiple
- Values: Specifications; Demonstration; Independent testing; Owner experience; Professional advice; Trial; Warranty
- Rule: Different evidence can answer different questions.
- Ask: What would make a claim credible?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P194 Uncertainty tolerance

- Selection: Single
- Values: Needs strong certainty; Accepts limited uncertainty; Comfortable experimenting; Varies by stakes
- Rule: Context-specific self-report; no psychological diagnosis.
- Ask: What uncertainty needs resolving?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P195 Consultation preference

- Selection: Multiple
- Values: Self-directed; Partner; Family; Friends; Peers; Specialist; Community
- Rule: Record actual chosen advisors, not identity-based assumptions.
- Ask: Whose input is wanted?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P196 Option elimination method

- Selection: Multiple
- Values: Budget filter; Must-have filter; Availability; Evidence quality; Trial results; Personal preference
- Rule: Describe the method rather than prescribing a winner.
- Ask: What removes an option from the shortlist?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P197 Reversibility preference

- Selection: Scale
- Values: Not important; Slightly important; Moderately important; Very important; Essential
- Rule: May motivate trials, returns, or shorter commitments.
- Ask: How important is the ability to change the decision?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P198 Decision confidence

- Selection: Single
- Values: Confident; Mostly confident; Unsure; Needs more information; Decision paused
- Rule: Self-reported current state, not inferred emotion.
- Ask: What information would increase confidence?
- Scope: Specific task, not a permanent personality diagnosis
- Evidence: Self-report plus permitted observation of decision tasks
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 19 Interest intensity & participation

### P199 Interest topic hierarchy

- Selection: Repeated
- Values: Domain; Topic; Subtopic; Local or niche label
- Rule: Open hierarchy accommodates any interest, not just the examples in this library.
- Ask: What exactly is the person interested in?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P200 Interest strength

- Selection: Single
- Values: No interest; Curious; Casual interest; Active interest; Deep enthusiast; Professional involvement
- Rule: Professional involvement and enthusiasm need not coincide.
- Ask: How deeply does the person engage?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P201 Participation mode

- Selection: Multiple
- Values: Reads or watches; Discusses; Practices; Creates; Competes; Collects; Teaches; Organizes
- Rule: Watching an activity is not evidence of practicing it.
- Ask: What does participation actually involve?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P202 Interest recency

- Selection: Single
- Values: Current; Recently started; Seasonal; Long-standing; Dormant; Former interest
- Rule: A historical interest may no longer be relevant.
- Ask: Is this interest active now?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P203 Interest frequency

- Selection: Single
- Values: Daily; Weekly; Monthly; Seasonal; Occasional; Rare
- Rule: Record the activity and period.
- Ask: How often does engagement occur?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P204 Interest spending commitment

- Selection: Single
- Values: No spending; Occasional small spend; Regular budget; Major priority; Not measured
- Rule: Amount bands require local context; do not infer income.
- Ask: Is interest accompanied by spending?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P205 Interest expertise

- Selection: Single
- Values: Beginner; Developing; Experienced; Advanced; Specialist
- Rule: Self-description or task evidence; separate from education and age.
- Ask: What level of detail would be useful?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P206 Interest community affiliation

- Selection: Text
- Values: Named club; Informal group; Online community; Solo participation; No affiliation
- Rule: Avoid collecting private group memberships without a valid purpose and permission.
- Ask: Where does the person share the interest?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P207 Interest goals

- Selection: Multiple
- Values: Enjoyment; Skill; Social connection; Achievement; Income; Identity expression; Contribution
- Rule: Let the person select multiple motivations.
- Ask: Why does this interest matter?
- Scope: One interest at a time; reference period required
- Evidence: Self-reported interests; consented activity evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 20 Interest domains & subtopics

### P208 Sports interests

- Selection: Multiple
- Values: Association football; Cricket; Basketball; Volleyball; Rugby; Baseball; Hockey; Racquet sports; Athletics; Combat sports; Motorsport; Other
- Rule: Distinguish watching, playing, coaching, and collecting.
- Ask: Which sport and participation mode matter?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P209 Fitness and movement interests

- Selection: Multiple
- Values: Walking; Running; Strength training; Cycling; Swimming; Yoga; Dance; Group classes; Adaptive movement
- Rule: Interest does not establish fitness level or medical status.
- Ask: Which activity does the person enjoy?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P210 Outdoor and nature interests

- Selection: Multiple
- Values: Hiking; Camping; Birdwatching; Gardening; Climbing; Water recreation; Conservation; Nature photography
- Rule: Separate interest from equipment ownership and access.
- Ask: What setting and equipment are relevant?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P211 Travel interests

- Selection: Multiple
- Values: Local exploration; Culture; Food; Nature; Adventure; Relaxation; Heritage; Family trips; Long stays
- Rule: Desired travel is not observed travel frequency.
- Ask: What kind of trip is appealing?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P212 Food and cooking interests

- Selection: Multiple
- Values: Home cooking; Baking; Regional cuisines; Street food; Fine dining; Food science; Preservation; Gardening for food
- Rule: Cuisine interest does not determine nationality or religion.
- Ask: Which food topics or experiences are interesting?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P213 Music interests

- Selection: Multiple
- Values: Local genres; Classical; Folk; Popular music; Jazz; Electronic; Hip-hop; Rock; Devotional by choice; Other
- Rule: Use an open genre vocabulary; do not infer beliefs from listening.
- Ask: Does the person listen, perform, produce, or collect?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P214 Film and television interests

- Selection: Multiple
- Values: Drama; Comedy; Documentary; Animation; Regional cinema; Science fiction; Thriller; Reality; Other
- Rule: Age suitability and local content preferences are separate.
- Ask: Which genres and languages are preferred?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P215 Reading and literature interests

- Selection: Multiple
- Values: Fiction; Nonfiction; Poetry; Comics; Biography; History; Technical reading; Local literature
- Rule: Reading preference does not imply education level.
- Ask: Which subject, format, and depth are appealing?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P216 Visual art and design interests

- Selection: Multiple
- Values: Drawing; Painting; Sculpture; Digital art; Architecture; Graphic design; Interior design; Exhibitions
- Rule: Distinguish making, studying, viewing, and buying art.
- Ask: Is the person creating or appreciating?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P217 Performance interests

- Selection: Multiple
- Values: Theater; Dance; Comedy; Traditional performance; Opera; Musical theater; Public speaking
- Rule: Local traditions and self-described subgenres remain open.
- Ask: Does the person attend or perform?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P218 Photography and video interests

- Selection: Multiple
- Values: Phone photography; Portraits; Landscape; Documentary; Video creation; Editing; Equipment
- Rule: Equipment interest alone is not a purchase signal.
- Ask: What does the person want to capture or create?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P219 Crafts and making interests

- Selection: Multiple
- Values: Sewing; Knitting; Woodwork; Pottery; Jewelry making; Model making; Paper crafts; Repair
- Rule: Skills and equipment access are separate dimensions.
- Ask: What project is underway?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P220 Fashion and style interests

- Selection: Multiple
- Values: Everyday style; Streetwear; Formalwear; Modest style; Traditional dress; Vintage; Design; Accessories
- Rule: Styles are not assigned by gender, religion, or income.
- Ask: What aesthetic does the person choose?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P221 Beauty and grooming interests

- Selection: Multiple
- Values: Skincare; Haircare; Makeup; Fragrance; Grooming; Nail care; Personal-care routines
- Rule: Interest is open to any identity; avoid appearance-based inference.
- Ask: What routine or technique is being explored?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P222 Home and interiors interests

- Selection: Multiple
- Values: Decor; Organization; Renovation; Furniture; Lighting; Small-space living; Smart home; Gardening
- Rule: Renting does not preclude interest in home design.
- Ask: Which home project or style matters?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P223 Technology interests

- Selection: Multiple
- Values: Consumer devices; Software; AI; Robotics; Electronics; Cybersecurity; Open source; Emerging technology
- Rule: Do not equate interest with expertise or tool adoption.
- Ask: What technology topic is being explored?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P224 Science and discovery interests

- Selection: Multiple
- Values: Space; Physics; Biology; Chemistry; Earth science; Mathematics; Environment; Citizen science
- Rule: Include informal curiosity as well as professional study.
- Ask: Which scientific question attracts interest?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P225 Gaming interests

- Selection: Multiple
- Values: Mobile; Console; PC; Tabletop; Puzzles; Strategy; Role-playing; Esports; Social gaming
- Rule: Separate playing, watching, creating, and competitive participation.
- Ask: What kind of gaming experience is preferred?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P226 Vehicles and mobility interests

- Selection: Multiple
- Values: Cars; Motorcycles; Bicycles; Public transport; EVs; Restoration; Vehicle design; Accessible mobility
- Rule: Enthusiasm does not establish ownership or purchase intent.
- Ask: Is this an interest, practical need, or active purchase?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P227 Business and entrepreneurship interests

- Selection: Multiple
- Values: Starting a business; Operations; Marketing; Product building; Leadership; Freelancing; Local enterprise
- Rule: Do not assume the person owns a business.
- Ask: Which business challenge is being explored?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P228 Money and economic-learning interests

- Selection: Multiple
- Values: Budgeting; Saving; Economic literacy; Investing education; Retirement learning; Business finance; Consumer rights
- Rule: Educational interest only; no financial recommendation or suitability inference.
- Ask: What financial concept does the person want to understand?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P229 History and heritage interests

- Selection: Multiple
- Values: Local history; Family history; Archaeology; Museums; Architecture; Oral traditions; Cultural preservation
- Rule: Do not infer ancestry or identity from interest.
- Ask: Which history or heritage topic is relevant?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P230 Language and cultural-learning interests

- Selection: Multiple
- Values: Language study; Translation; Literature; Cultural exchange; Calligraphy; Local traditions; Sign languages
- Rule: Separate curiosity, proficiency, and cultural identity.
- Ask: Which language or cultural skill is being learned?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P231 Philosophy and reflective interests

- Selection: Multiple
- Values: Ethics; Philosophy; Meditation; Meaning; Comparative belief study; Personal reflection
- Rule: Voluntary topic interest; not a religious or psychological classification.
- Ask: Which ideas does the person choose to explore?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P232 Community and civic participation interests

- Selection: Multiple
- Values: Volunteering; Local services; Community projects; Accessibility; Public spaces; Mutual aid
- Rule: Do not infer voting preferences or political affiliation.
- Ask: What community activity interests the person?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P233 Relationships and family-learning interests

- Selection: Multiple
- Values: Communication; Parenting education; Caregiving; Friendship; Family activities; Relationship skills
- Rule: Interest is not evidence of marital status, pregnancy, or personal difficulty.
- Ask: What topic does the person choose to learn about?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P234 Animals and pet interests

- Selection: Multiple
- Values: Pet care; Animal behavior; Wildlife; Conservation; Equestrian activities; Aquatic life; Working animals
- Rule: Interest does not prove animal ownership.
- Ask: Is the person caring for an animal or exploring a topic?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P235 Agriculture and growing interests

- Selection: Multiple
- Values: Home gardening; Farming; Livestock; Beekeeping; Aquaculture; Soil; Food systems; Rural enterprise
- Rule: Distinguish livelihood activity, study, and recreation.
- Ask: What growing or production activity matters?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P236 Wellbeing interests

- Selection: Multiple
- Values: Sleep routines; Relaxation; Everyday movement; Food literacy; Work-life balance; Supportive habits
- Rule: Interest does not identify a condition; no diagnosis or treatment assumptions.
- Ask: Which everyday routine is the person exploring?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P237 Collecting interests

- Selection: Multiple
- Values: Art; Books; Coins; Stamps; Watches; Memorabilia; Toys; Antiques; Digital collectibles; Other
- Rule: Collecting is not evidence of wealth or investment suitability.
- Ask: What is collected, and why?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P238 Events and social-experience interests

- Selection: Multiple
- Values: Festivals; Concerts; Sports events; Workshops; Meetups; Community celebrations; Exhibitions
- Rule: Participation may be occasional and budget-independent.
- Ask: Which type of shared experience is appealing?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P239 Specialist or emerging interests

- Selection: Text
- Values: Any niche topic; Local tradition; New activity; Cross-domain interest
- Rule: Add domain, subtopic, and self-description instead of forcing a closest match.
- Ask: What interest is missing from the current vocabulary?
- Scope: Multiple interests allowed; open-ended global vocabulary
- Evidence: Voluntary selection; do not infer identity, beliefs, health, or buying intent
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 21 Leisure & lifestyle patterns

### P240 Leisure setting preference

- Selection: Multiple
- Values: At home; Outdoors; Local venues; Travel; Online; Mixed
- Rule: Preference and practical access are separate.
- Ask: Where does the person like to spend leisure time?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P241 Social setting preference

- Selection: Single
- Values: Solo; One-to-one; Small group; Large group; Varies
- Rule: Not a clinical personality assessment.
- Ask: What group size is comfortable for this activity?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P242 Activity intensity preference

- Selection: Single
- Values: Restful; Light activity; Moderate activity; Intense activity; Mixed
- Rule: Activity preference is not a health or fitness diagnosis.
- Ask: How active should the experience be?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P243 Planning spontaneity

- Selection: Single
- Values: Detailed plan; Loose plan; Spontaneous; Depends on occasion
- Rule: Record per activity rather than as a permanent trait.
- Ask: Does the person prefer advance planning?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P244 Home-centered versus out-of-home

- Selection: Single
- Values: Mostly home-centered; Balanced; Mostly outside home; Situation-dependent
- Rule: May reflect constraints rather than preference.
- Ask: Is staying home a choice or a requirement?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P245 Membership participation

- Selection: Multiple
- Values: Clubs; Gyms; Libraries; Community groups; Professional networks; Subscription communities; None
- Rule: Membership is not proof of frequent participation.
- Ask: Which memberships are actually used?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P246 Creative expression

- Selection: Multiple
- Values: Writing; Making; Performing; Designing; Cooking; Photography; Other; No stated activity
- Rule: Creative expression can occur without paid hobbies.
- Ask: How does the person express creativity?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P247 Sharing versus private enjoyment

- Selection: Single
- Values: Mostly private; Close circle; Community sharing; Public sharing; Varies
- Rule: Do not publish private activity without permission.
- Ask: Is sharing part of the experience?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P248 Lifestyle changes sought

- Selection: Text
- Values: More time; Less clutter; More activity; Greater connection; Simpler routines; Other
- Rule: A stated aspiration, not a claim that change is needed.
- Ask: What does the person want to change?
- Scope: Situation and recent period
- Evidence: Voluntary report; avoid fixed lifestyle stereotypes
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 22 Food, dining & everyday preferences

### P249 Eating pattern

- Selection: Multiple
- Values: Omnivorous; Vegetarian; Vegan; Pescatarian; Flexitarian; Other self-description
- Rule: Allow variation by day and setting; do not infer beliefs.
- Ask: Which options should be included?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P250 Ingredient exclusions

- Selection: Text
- Values: Named ingredients to avoid; No exclusions; Not stated
- Rule: Treat safety-related exclusions carefully; do not infer a diagnosis.
- Ask: What must be excluded?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Sensitive / contextual
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P251 Cuisine preferences

- Selection: Multiple
- Values: Any named local or international cuisine; Mixed cuisines; Open to discovery
- Rule: No globally exhaustive cuisine list; record self-described preferences.
- Ask: Which cuisines are appealing?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P252 Food preparation responsibility

- Selection: Single
- Values: Usually prepares; Shares preparation; Others prepare; Mostly buys prepared food; Varies
- Rule: Do not assign by gender or household role.
- Ask: Who prepares meals?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P253 Cooking capability and equipment

- Selection: Repeated
- Values: Skill; Equipment available; Time; Kitchen access
- Rule: Capability differs from interest in cooking.
- Ask: What can realistically be prepared?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P254 Dining occasion

- Selection: Multiple
- Values: Routine meal; Work meal; Family meal; Celebration; Social outing; Solo dining; Travel meal
- Rule: The same person may choose different price tiers by occasion.
- Ask: What is the meal occasion?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P255 Convenience-food preference

- Selection: Single
- Values: Cook from scratch; Meal components; Ready-to-eat; Delivery; Mixed
- Rule: Preference may be constrained by time or facilities.
- Ask: Which preparation effort is acceptable?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P256 Taste and sensory preferences

- Selection: Multiple
- Values: Mild; Spicy; Sweet; Sour; Bitter; Savory; Texture-specific; Other
- Rule: Record actual preferences without cultural stereotypes.
- Ask: Which tastes or textures are preferred?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P257 Food sourcing priorities

- Selection: Multiple
- Values: Price; Freshness; Local origin; Seasonality; Convenience; Ingredient transparency; Other
- Rule: Stated priorities are not observed spending unless measured.
- Ask: What matters most when choosing food?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P258 Dining service needs

- Selection: Multiple
- Values: Accessible seating; Quiet setting; Child-friendly setup; Quick service; Group seating; Takeaway; None
- Rule: Ask practical needs rather than inferring a family or disability persona.
- Ask: What must the dining experience accommodate?
- Scope: Person or household; stated requirements
- Evidence: Self-report of practical needs; no identity or health inference
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 23 Mobility & travel behavior

### P259 Everyday transport modes

- Selection: Multiple
- Values: Walking; Cycling; Public transit; Private vehicle; Shared vehicle; Ride service; Assisted transport; Other
- Rule: Access does not imply ownership or preference.
- Ask: How does the person usually get around?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P260 Vehicle access

- Selection: Single
- Values: Own vehicle; Household-shared; Employer-provided; Rental or shared service; Borrowed; No access
- Rule: Separate driver, passenger, payer, and owner.
- Ask: Is reliable vehicle access available?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P261 Commute pattern

- Selection: Single
- Values: No regular commute; Short local; Longer daily; Several sites; Overnight travel; Variable
- Rule: Use actual distance or time when needed; labels are not geographic standards.
- Ask: What travel task needs solving?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P262 Commute distance or duration

- Selection: Repeated
- Values: Distance; Unit; One-way or round-trip; Minutes; Days per week
- Rule: Keep time, distance, and frequency separate.
- Ask: What is the real travel load?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P263 Trip purpose

- Selection: Multiple
- Values: Work; Education; Caregiving; Shopping; Health services; Leisure; Family visit; Other
- Rule: One trip can serve several purposes.
- Ask: Why is the trip being made?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P264 Travel party

- Selection: Multiple
- Values: Solo; Partner; Friends; Children; Extended family; Colleagues; Assisted group
- Rule: Record relevant practical needs without inferring relationships.
- Ask: Who is traveling?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P265 Travel frequency

- Selection: Single
- Values: Never in period; Once; Several times yearly; Monthly; Weekly; More often
- Rule: Specify local, domestic, or international travel and period.
- Ask: How frequently must travel be supported?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P266 Travel planning lead time

- Selection: Single
- Values: Same day; Under 1 week; 1-4 weeks; 1-3 months; More than 3 months
- Rule: Authored planning bands; occasion-dependent.
- Ask: How far ahead does planning begin?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P267 Accommodation preference

- Selection: Multiple
- Values: Family or friends; Budget lodging; Apartment; Hotel; Resort; Camping; Accessible accommodation; Other
- Rule: Preference and available budget remain separate.
- Ask: What type of stay fits the need?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P268 Travel constraints

- Selection: Multiple
- Values: Budget; Time; Documentation; Care responsibilities; Accessibility; Route availability; Other
- Rule: Collect practical constraints, not detailed legal or medical status unless essential.
- Ask: What could prevent the trip?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

### P269 Vehicle and travel feature requirements

- Selection: Multiple
- Values: Cargo capacity; Seating; Child-seat fit; Accessibility; Range; Charging; Comfort; Reliability
- Rule: Direct requirements generate relevant questions; demographics alone do not.
- Ask: Which features are nonnegotiable?
- Scope: Person or household; trip and reference period
- Evidence: Self-report; coarse route context only
- Handling: Personal / minimize
- Basis: Consumption reference: COICOP 2018. Persona fields and bands are authored, not an official crosswalk. https://unstats.un.org/unsd/classifications/Econ

## 24 Accessibility & support needs

### P270 Visual access needs

- Selection: Multiple
- Values: Larger text; High contrast; Screen reader; Magnification; Nonvisual alternatives; No stated need
- Rule: Do not infer a diagnosis from an accommodation preference.
- Ask: Which visual presentation options are needed?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P271 Auditory access needs

- Selection: Multiple
- Values: Captions; Transcript; Sign-language support; Visual alerts; Volume control; No stated need
- Rule: Support may also be situational, such as a noisy environment.
- Ask: Must information be available without sound?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P272 Motor and input needs

- Selection: Multiple
- Values: Keyboard access; Voice control; Switch access; Larger controls; Reduced precision; Alternative input
- Rule: Record the desired interaction, not a medical label.
- Ask: How should controls be operated?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P273 Cognitive and learning support

- Selection: Multiple
- Values: Plain language; Short steps; Consistent layout; Memory aids; Extra time; Reduced distraction
- Rule: Self-stated support only; not an intelligence score.
- Ask: What would make the task easier to understand?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P274 Speech and communication access

- Selection: Multiple
- Values: Text chat; Alternative communication; Interpreter; Asynchronous communication; Voice communication
- Rule: Voice-only experiences may not meet the stated need.
- Ask: Which communication methods should be supported?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P275 Sensory environment preferences

- Selection: Multiple
- Values: Quiet; Reduced motion; Lower light; Low fragrance; Fewer visual distractions; Flexible environment
- Rule: A preference does not establish neurotype or diagnosis.
- Ask: What environment is comfortable?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P276 Physical service access

- Selection: Multiple
- Values: Step-free access; Seating; Rest breaks; Accessible toilet; Delivery; Assisted service; No stated need
- Rule: Record concrete facility or service requirements.
- Ask: What must the physical service provide?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P277 Assistive-technology compatibility

- Selection: Text
- Values: User-named device or software; Compatibility requirement; No stated requirement
- Rule: Collect only the compatibility detail needed for testing.
- Ask: Which assistive technology must work?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P278 Temporary or situational constraints

- Selection: Multiple
- Values: Injury-related support; Hands occupied; Bright light; Noisy setting; Fatigue; Low connectivity
- Rule: Context may be temporary; avoid making it a permanent identity label.
- Ask: What is making this task harder right now?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P279 Health-related service requirements

- Selection: Text
- Values: Voluntarily stated service constraint or accommodation; Not collected
- Rule: No diagnoses or treatment recommendations are generated by this framework.
- Ask: What practical support is needed?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

### P280 Privacy around accommodations

- Selection: Single
- Values: Share only with service provider; Share with chosen support person; Do not retain; Other instruction
- Rule: Do not disclose sensitive needs in public persona descriptions.
- Ask: Who is allowed to see this information?
- Scope: Task-specific needs; voluntary, not diagnostic
- Evidence: Self-stated accommodation needs; accessibility testing
- Handling: Sensitive / support only
- Basis: Accessibility reference: W3C WAI. Options describe support needs, not diagnoses. https://www.w3.org/WAI/fundamentals/accessibility-intro/

## 25 Product fit & sensory requirements

### P281 Physical fit requirements

- Selection: Text
- Values: Relevant dimensions; Size system; Space constraints; Fit preferences
- Rule: Measurements may be personal; collect only what is necessary.
- Ask: What must fit the body, room, or equipment?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P282 Material preferences

- Selection: Multiple
- Values: Natural materials; Synthetic materials; Metal; Wood; Fabric; Specific materials; No preference
- Rule: Material preference is not a medical or cultural identity.
- Ask: Which materials are preferred or excluded?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P283 Style and aesthetics

- Selection: Multiple
- Values: Minimal; Traditional; Contemporary; Colorful; Neutral; Ornate; Functional; Eclectic; Self-description
- Rule: Style is open and not assigned from age, gender, or class.
- Ask: What visual style does the person choose?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P284 Color preferences

- Selection: Text
- Values: Any named color or palette; No preference; Task-specific requirement
- Rule: Ask directly; do not assign gendered colors.
- Ask: Which colors are preferred?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P285 Sensory product characteristics

- Selection: Multiple
- Values: Texture; Sound; Smell; Weight; Temperature; Lighting; Tactile feedback
- Rule: Differentiate preference from an explicit safety requirement.
- Ask: Which sensory properties affect comfort?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P286 Durability and maintenance requirements

- Selection: Multiple
- Values: Long life; Easy repair; Washable; Weather resistance; Low maintenance; Replaceable parts
- Rule: Requirements vary by use and environment.
- Ask: What conditions must the product withstand?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P287 Portability and storage

- Selection: Multiple
- Values: Pocket-sized; Portable; Foldable; Stackable; Fixed installation; Minimal storage
- Rule: Use dimensions or task examples rather than vague suitability claims.
- Ask: How will it be moved and stored?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P288 Compatibility requirements

- Selection: Text
- Values: Existing device; Existing system; Household setup; Workplace standard; Other dependency
- Rule: Record actual version or specification when needed.
- Ask: What must it work with?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P289 Ethical and material exclusions

- Selection: Text
- Values: Explicitly excluded materials, practices, or product characteristics
- Rule: Record requirements, not inferred identity or political beliefs.
- Ask: What is unacceptable in this product?
- Scope: One product or experience at a time
- Evidence: Direct requirements; user-provided measurements where necessary
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 26 Digital access & devices

### P290 Internet access pattern

- Selection: Single
- Values: No access; Occasional shared access; Mobile-only; Fixed-only; Both mobile and fixed; Other
- Rule: Digital absence is a valid profile, not missing interest or low ability.
- Ask: Can the service be used offline?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P291 Device access

- Selection: Multiple
- Values: Feature phone; Smartphone; Tablet; Computer; Smart TV; Console; Shared device; No personal device
- Rule: Access and ownership are distinct.
- Ask: Which device can the person actually use?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P292 Primary device for the task

- Selection: Single
- Values: Feature phone; Smartphone; Tablet; Computer; Other device; Assisted access
- Rule: Task-specific; a person may use different devices for work and shopping.
- Ask: Which device should the experience prioritize?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P293 Device sharing

- Selection: Single
- Values: Private device; Shared household device; Shared public device; Employer-managed; Mixed
- Rule: Sharing affects privacy and session continuity.
- Ask: Is a private session possible?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P294 Connection reliability

- Selection: Single
- Values: Reliable; Intermittent; Frequently unavailable; Offline
- Rule: Record actual experience instead of inferring from country or income.
- Ask: Can progress survive a connection loss?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P295 Data affordability and caps

- Selection: Single
- Values: No meaningful cap; Limited allowance; Pay-per-use; Cost-constrained; Unknown
- Rule: Do not assume low use means low interest.
- Ask: Is a low-data experience needed?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P296 Access location

- Selection: Multiple
- Values: Home; Workplace; School; Public facility; Mobile network; Community point; Other
- Rule: Avoid precise location tracking.
- Ask: Where is access normally available?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P297 Operating environment

- Selection: Text
- Values: User-named operating system, browser, app, or version
- Rule: Keep technical details current; do not infer personal identity from devices.
- Ask: Are there compatibility constraints?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P298 Peripheral access

- Selection: Multiple
- Values: Keyboard; Printer; Camera; Microphone; Headphones; Scanner; Assistive equipment; None
- Rule: Ask only for the task's requirements.
- Ask: Can the person complete the required input or output?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

### P299 Offline fallback preference

- Selection: Multiple
- Values: Phone; SMS; Paper; In-person; Downloadable files; Local agent; None
- Rule: The framework must support people outside digital channels.
- Ask: What is the fallback channel?
- Scope: Person or household; current availability
- Evidence: Self-report and permitted device evidence; include offline populations
- Handling: Personal / minimize
- Basis: Digital-access context: ITU Facts and Figures 2024; no statistics imported. https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/

## 27 Digital confidence & preferences

### P300 Digital task confidence

- Selection: Single
- Values: Needs assistance; Can do basic tasks; Comfortable with common tasks; Advanced user; Task-dependent
- Rule: Self-report or observation, never inferred from age or schooling.
- Ask: Which steps need guidance?
- Scope: Task-specific and current
- Evidence: Self-report; consented usability observation
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P301 Account and app tolerance

- Selection: Single
- Values: No account preferred; Account acceptable; App acceptable; Browser only; Assisted setup
- Rule: Record preference separately from technical capability.
- Ask: Is installation or registration a barrier?
- Scope: Task-specific and current
- Evidence: Self-report; consented usability observation
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P302 Automation preference

- Selection: Single
- Values: Manual control; Suggestions only; Automate with approval; Automate selected tasks; Task-dependent
- Rule: Do not infer willingness to delegate from device use.
- Ask: What can be automated?
- Scope: Task-specific and current
- Evidence: Self-report; consented usability observation
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P303 Personalization preference

- Selection: Single
- Values: None; User-configured; Session-only; Saved preferences; Broader personalization with permission
- Rule: Respect stated boundaries and do not treat silence as permission.
- Ask: Which preferences may be remembered?
- Scope: Task-specific and current
- Evidence: Self-report; consented usability observation
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P304 Privacy preference

- Selection: Multiple
- Values: Minimal data; Anonymous browsing; No tracking; Limited retention; Private channels; User-managed controls
- Rule: A preference is not a complete record of legal consent.
- Ask: What information should not be collected?
- Scope: Task-specific and current
- Evidence: Self-report; consented usability observation
- Handling: Personal / explicit permission
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P305 Security support needs

- Selection: Multiple
- Values: Plain explanations; Account recovery help; Fraud-awareness support; Shared-device privacy; Accessible authentication
- Rule: Do not identify people as easy fraud targets.
- Ask: What would make secure access easier?
- Scope: Task-specific and current
- Evidence: Self-report; consented usability observation
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P306 Notification preferences

- Selection: Multiple
- Values: None; Email; SMS; App notification; Messaging; Scheduled summary
- Rule: Separate channel preference, timing, and permission.
- Ask: How should updates be delivered?
- Scope: Task-specific and current
- Evidence: Self-report; consented usability observation
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P307 Technology-change preference

- Selection: Single
- Values: Keep familiar tools; Change when necessary; Adopt after evidence; Experiment willingly; Context-dependent
- Rule: Self-reported choice, not a fixed adopter type.
- Ask: What would justify switching tools?
- Scope: Task-specific and current
- Evidence: Self-report; consented usability observation
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 28 Social platforms & communities

### P308 Named social platforms used

- Selection: Multiple
- Values: Facebook; Instagram; YouTube; TikTok; Snapchat; X; Reddit; Pinterest; LinkedIn; Threads; Bluesky; Any other service
- Rule: Illustrative names, not a complete platform inventory or global reach ranking.
- Ask: Which platforms does this person actually use?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P309 Messaging platforms used

- Selection: Multiple
- Values: WhatsApp; Telegram; Signal; LINE; KakaoTalk; WeChat; Zalo; Viber; SMS; Other
- Rule: Record actual use; geography or ethnicity does not establish platform preference.
- Ask: Which messaging service is chosen?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Named examples only; no regional adoption assumptions. https://www.line.me/en/

### P310 Local and regional platform record

- Selection: Text
- Values: Any local service; ShareChat; Zalo; Bilibili; Other self-named platform
- Rule: Open list; verify names and availability in the relevant market.
- Ask: Which locally important platform is missing?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Named examples only; allow any local service. https://sharechat.com/

### P311 Community platform types

- Selection: Multiple
- Values: Discussion forum; Private group; Creator community; Professional network; Gaming community; Local neighborhood group; Other
- Rule: Membership does not establish trust or buying influence.
- Ask: Which community format is useful?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P312 Platform use frequency

- Selection: Repeated
- Values: Platform; Never; Less than monthly; Monthly; Weekly; Daily; Multiple times daily
- Rule: Record period; do not mix ever-use with daily use.
- Ask: How often is each platform used?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Measurement example only: Pew, US adults, 2025. Not global prevalence or buying influence. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P313 Platform time spent

- Selection: Repeated
- Values: Platform; Minutes per day or week; Self-report or device measure
- Rule: Usage time is not purchase influence; document measurement method.
- Ask: Where is attention actually spent?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P314 Purpose by platform

- Selection: Repeated
- Values: Keep in touch; Entertainment; Learning; News; Work; Discovery; Product research; Shopping; Support
- Rule: The same platform can serve different purposes.
- Ask: What job does each platform perform?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P315 Participation by platform

- Selection: Repeated
- Values: Reader or viewer; Commenter; Contributor; Creator; Moderator; Seller; Organizer
- Rule: Reading without posting is still participation.
- Ask: How does the person participate?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P316 Platform influence by journey stage

- Selection: Repeated
- Values: Platform; Discover; Explore; Compare; Decide; Use; Reported influence; Evidence
- Rule: A hypothesis is not observed influence; validate the stated pathway.
- Ask: Did this platform affect this specific decision?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P317 Creator-following behavior

- Selection: Multiple
- Values: No creators followed; Entertainment creators; Subject experts; Local creators; Product reviewers; Peers
- Rule: Following does not imply trust or agreement.
- Ask: Whose content is chosen, and for what purpose?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P318 Social sharing preference

- Selection: Single
- Values: No sharing; Private messages; Small groups; Public posting; Varies by topic
- Rule: Do not expose private activity or infer hidden beliefs.
- Ask: Where would the person share a question?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P319 Social commerce activity

- Selection: Single
- Values: No shopping activity; Discovers products; Researches products; Contacts sellers; Purchases; Sells
- Rule: Distinguish each activity and platform; use does not prove transaction completion.
- Ask: Does the journey move from content to purchase?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P320 Group decision support

- Selection: Multiple
- Values: Owner groups; Hobby groups; Family chats; Professional peers; Local communities; None
- Rule: Only use voluntarily shared, relevant community context.
- Ask: Which group helps answer practical questions?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

### P321 Platform access limitations

- Selection: Multiple
- Values: No account; No device access; Language barrier; Accessibility barrier; Connectivity; Personal avoidance; Other
- Rule: Do not assume missing platform data equals no interest.
- Ask: Is the selected channel actually accessible?
- Scope: Each platform separately; local market and period
- Evidence: Voluntary platform report or consented records; no private-message scraping
- Handling: Personal / minimize
- Basis: Illustrative platform names, not popularity or country-availability claims. Open vocabulary; validate locally. https://www.pewresearch.org/internet/fact-sheet/social-media/

## 29 Media & content consumption

### P322 Media channels used

- Selection: Multiple
- Values: Television; Radio; Print; Websites; Email; Podcasts; Streaming; Social platforms; Messaging; In-person sources
- Rule: Include offline media and shared-device access.
- Ask: Where does the person get information?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P323 Preferred content format

- Selection: Multiple
- Values: Short text; Long article; Images; Short video; Long video; Audio; Live session; Interactive tool; Download
- Rule: A format preference can differ by topic.
- Ask: What format fits the task?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P324 Content depth

- Selection: Single
- Values: Headline or summary; Practical overview; Step-by-step; Detailed analysis; Technical reference
- Rule: Do not derive from education or age.
- Ask: How much detail is useful?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P325 Content language by channel

- Selection: Repeated
- Values: Channel; Language; Script; Translation preference
- Rule: Search, entertainment, and support languages may differ.
- Ask: Which language belongs in each channel?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P326 Discovery mechanism

- Selection: Multiple
- Values: Search; Feed; Recommendation; Subscription; Word of mouth; Browse; Offline event; Direct visit
- Rule: Document observed mechanism versus assumed discovery.
- Ask: How did the person find this?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P327 Content consumption mode

- Selection: Multiple
- Values: Focused reading; Background audio; Shared viewing; Quick scanning; Saving for later; Live participation
- Rule: Low dwell time alone does not establish low interest.
- Ask: How is content used?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P328 Live versus on-demand preference

- Selection: Single
- Values: Live; On-demand; Both; Topic-dependent
- Rule: Consider timezone and availability separately.
- Ask: Must the content be usable later?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P329 Subscription willingness

- Selection: Single
- Values: Free only; Ad-supported; Paid for selected value; Regular paid subscriptions; Undecided
- Rule: Ability to pay and willingness to pay are separate.
- Ask: What value would justify paying?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P330 Advertising tolerance

- Selection: Single
- Values: Avoids ads; Accepts limited ads; Accepts relevant ads; No strong preference
- Rule: Preference is not legal consent to tracking.
- Ask: What promotion level is acceptable?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P331 Content credibility checks

- Selection: Multiple
- Values: Source identity; Date; Evidence; Multiple sources; Author expertise; Disclosure; None stated
- Rule: Self-report may differ from observed verification.
- Ask: What makes the information trustworthy?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P332 Content response behavior

- Selection: Multiple
- Values: Reads only; Saves; Shares; Comments; Asks questions; Contacts provider; Purchases
- Rule: Do not treat engagement as a purchase by default.
- Ask: What action follows useful content?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P333 Entertainment versus utility mix

- Selection: Single
- Values: Mainly entertainment; Mainly practical use; Balanced; Depends on channel
- Rule: Record actual purpose rather than assigning a lifestyle stereotype.
- Ask: Is the audience seeking enjoyment or a solution?
- Scope: Channel, format, purpose, and reference period
- Evidence: Media diary, self-report, or permissioned analytics
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 30 Search, information & AI behavior

### P334 Search starting point

- Selection: Multiple
- Values: General search; Marketplace; Social search; Video search; Map or local search; AI assistant; Specialist site; Offline advisor
- Rule: No channel is assumed from demographics.
- Ask: Where does this task start?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P335 Query entry mode

- Selection: Multiple
- Values: Typed keywords; Full sentence; Voice; Image; Screenshot; Assisted entry; Other
- Rule: Access mode and search intent are separate.
- Ask: How will the person express the need?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P336 Query specificity

- Selection: Single
- Values: Broad need; Category named; Requirements stated; Shortlist named; Exact item; Troubleshooting detail
- Rule: Classify the visible query, not hidden intent.
- Ask: What detail is missing from the question?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P337 Query intent

- Selection: Multiple
- Values: Learn; Find a place; Compare; Check eligibility; Buy; Book; Use; Repair; Cancel; Other
- Rule: Intents may coexist and change within one session.
- Ask: What outcome does the query seek?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P338 Information gap

- Selection: Multiple
- Values: Definitions; Fit; Options; Cost; Availability; Credibility; Process; Aftercare; Other
- Rule: Record the missing answer that would move the task forward.
- Ask: What does the person still need to know?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P339 Search refinement behavior

- Selection: Multiple
- Values: Adds budget; Adds use case; Adds location; Adds constraints; Changes channel; Asks a person; Stops
- Rule: Observe or ask; do not claim these are actual engine-generated subqueries.
- Ask: Which clarification is likely to be useful to test?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P340 AI-tool adoption for the task

- Selection: Single
- Values: Never used; Tried; Occasional use; Regular use; Main starting point; Avoids AI
- Rule: Usage is task-specific and does not establish trust.
- Ask: Is AI part of this workflow?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P341 AI task types

- Selection: Multiple
- Values: Explanation; Brainstorming; Comparison; Drafting; Planning; Data analysis; Coding; Action assistance; Other
- Rule: Record actual uses; no product capability claims are implied.
- Ask: Which task is delegated to AI?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P342 AI verification behavior

- Selection: Single
- Values: Always checks; Checks important claims; Sometimes checks; Rarely checks; Not applicable
- Rule: Self-report or observed task behavior; not a truthfulness score.
- Ask: What evidence should accompany an answer?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P343 AI action authority preference

- Selection: Single
- Values: Information only; Draft for review; Recommend options; Prepare action for approval; Limited authorized execution
- Rule: Explicit authorization is separate from general tool use.
- Ask: What may the assistant do without further approval?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P344 Information-language switching

- Selection: Multiple
- Values: One language; Searches multiple languages; Reads translation; Uses transliteration; Asks for simplified language
- Rule: A language change does not change identity or knowledge automatically.
- Ask: Would another language improve the search?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P345 Desired answer format

- Selection: Multiple
- Values: Direct answer; Shortlist; Comparison table; Checklist; Demonstration; Source-backed explanation; Human consultation
- Rule: Match the stated task rather than assuming one answer format for all personas.
- Ask: What would a usable answer look like?
- Scope: Query, task, and session-specific
- Evidence: Explicit report or permitted logs; illustrative fan-out is not engine telemetry
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 31 Shopping behavior & channels

### P346 Purchase channel preference

- Selection: Multiple
- Values: Physical store; Brand website; Marketplace; App; Social seller; Phone; Local agent; Informal market
- Rule: Preference differs from available channels and completed purchases.
- Ask: Where would the person prefer to buy?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P347 Research-to-purchase path

- Selection: Single
- Values: Online research/online purchase; Online research/store purchase; Store research/online purchase; Offline only; Mixed
- Rule: Treat as an observed or stated path, not a universal segment.
- Ask: Where does the journey move between channels?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P348 Seller preference

- Selection: Multiple
- Values: Local independent; Large retailer; Direct brand; Marketplace seller; Specialist; Community seller; No preference
- Rule: Seller type does not guarantee trustworthiness or quality.
- Ask: What kind of seller is preferred?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P349 Product condition preference

- Selection: Multiple
- Values: New; Used; Refurbished; Open-box; Repaired; Rental; No preference
- Rule: Condition preference is not income class.
- Ask: Which conditions are acceptable?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P350 Ownership model preference

- Selection: Multiple
- Values: Own; Rent; Lease; Subscribe; Share; Borrow; Access without ownership
- Rule: State the product category and commitment period.
- Ask: Is ownership necessary?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P351 Promotion sensitivity

- Selection: Single
- Values: Rarely considers promotions; Compares offers; Waits for offers; Uses offers selectively; Unknown
- Rule: Do not infer financial hardship or target distress.
- Ask: Does timing depend on an offer?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P352 Price comparison behavior

- Selection: Single
- Values: Rarely compares; Checks a few sellers; Compares extensively; Uses an advisor; Category-dependent
- Rule: No claim that more comparison guarantees a better decision.
- Ask: What comparison support is needed?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P353 Trial and inspection preference

- Selection: Multiple
- Values: No trial needed; In-person inspection; Sample; Demonstration; Trial period; Independent inspection
- Rule: Requirements depend on product risk and reversibility.
- Ask: What must be tested before commitment?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P354 Shopping trip style

- Selection: Single
- Values: Targeted purchase; Browsing; Stock-up; Emergency replacement; Occasion shopping; Mixed
- Rule: Shopping mode can change from one occasion to the next.
- Ask: What is the purpose of this shopping session?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P355 Brand switching openness

- Selection: Single
- Values: Prefers current brand; Open with evidence; Actively exploring alternatives; No brand preference
- Rule: Do not infer loyalty from one prior transaction.
- Ask: What would justify trying an alternative?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P356 Purchase coordination

- Selection: Multiple
- Values: Individual; Household; Group purchase; Employer procurement; Gift recipient involved; Other
- Rule: Distinguish decision-maker, payer, and user.
- Ask: Who needs to agree?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P357 Cross-border purchasing behavior

- Selection: Single
- Values: Domestic only; Occasionally cross-border; Frequently cross-border; Willing but inexperienced; Avoids
- Rule: State shipping and payment context; no legal or tax conclusions are generated.
- Ask: What cross-border uncertainty needs clarification?
- Scope: Category, transaction, and observation period
- Evidence: Stated preferences or consented purchase evidence
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 32 Trust & perceived purchase risk

### P358 Trusted evidence sources

- Selection: Multiple
- Values: Independent tests; Owner experience; Personal contacts; Credentials; Official documentation; Demonstration; Other
- Rule: Trust is self-reported and does not prove factual reliability.
- Ask: Which source would help answer this concern?
- Scope: A provider, claim, or transaction at a time
- Evidence: Direct questions; verified first-party experience
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P359 Seller familiarity

- Selection: Single
- Values: First encounter; Recognized name; Previously considered; Previous customer; Ongoing relationship
- Rule: Awareness is not satisfaction or purchase intention.
- Ask: What does the person already know about the seller?
- Scope: A provider, claim, or transaction at a time
- Evidence: Direct questions; verified first-party experience
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P360 Primary purchase concerns

- Selection: Multiple
- Values: Financial loss; Poor fit; Low quality; Safety; Privacy; Non-delivery; Difficult support; Lock-in
- Rule: Concerns must be stated, not inferred from demographics.
- Ask: Which concern must be addressed with evidence?
- Scope: A provider, claim, or transaction at a time
- Evidence: Direct questions; verified first-party experience
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P361 Review evaluation preference

- Selection: Multiple
- Values: Recent reviews; Detailed owner accounts; Similar use cases; Verified transactions; Critical reviews; Specialist reviews
- Rule: Review format preferences are not a guarantee against manipulation.
- Ask: What review details are useful?
- Scope: A provider, claim, or transaction at a time
- Evidence: Direct questions; verified first-party experience
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P362 Transparency requirements

- Selection: Multiple
- Values: Full price; Product specifications; Seller identity; Sourcing; Terms; Limitations; Ongoing costs
- Rule: Prioritize facts relevant to the stated task.
- Ask: What must be disclosed clearly?
- Scope: A provider, claim, or transaction at a time
- Evidence: Direct questions; verified first-party experience
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P363 Assurance preference

- Selection: Multiple
- Values: Warranty; Returns; Trial; Inspection; Support commitment; Documentation; None stated
- Rule: Assurance terms require current provider verification in real use.
- Ask: What assurance would reduce uncertainty?
- Scope: A provider, claim, or transaction at a time
- Evidence: Direct questions; verified first-party experience
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P364 Data-sharing boundary for purchase

- Selection: Multiple
- Values: Contact details only; Necessary delivery details; No marketing use; No saved payment; Other restriction
- Rule: Preference must not be treated as a substitute for lawful permission.
- Ask: Which data is the person willing to provide?
- Scope: A provider, claim, or transaction at a time
- Evidence: Direct questions; verified first-party experience
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P365 Previous issue affecting trust

- Selection: Multiple
- Values: No reported issue; Product failure; Service issue; Unexpected fees; Privacy concern; Delivery failure; Other
- Rule: Record voluntary experience without creating a permanent vulnerability profile.
- Ask: What happened previously that should not recur?
- Scope: A provider, claim, or transaction at a time
- Evidence: Direct questions; verified first-party experience
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 33 Buyer journey & current intent

### P366 Journey stage

- Selection: Single
- Values: No current need; Need recognized; Discover; Explore; Compare; Decide; Purchase or book; Onboard; Use; Renew; Exit
- Rule: Stages can loop, overlap, or be skipped. This is an authored planning model.
- Ask: What decision is the person trying to make now?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P367 Problem awareness

- Selection: Single
- Values: No recognized problem; Recognizes symptoms; Can define problem; Has a clear requirement
- Rule: Classify stated awareness, not a hidden need invented by the seller.
- Ask: Can the person explain the problem?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P368 Solution awareness

- Selection: Single
- Values: No solution known; Category aware; Several approaches known; Preferred approach; Exact solution chosen
- Rule: Awareness and commitment are separate.
- Ask: Which approaches are already understood?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P369 Category consideration

- Selection: Single
- Values: Not considering; Curious; Actively exploring; Shortlisting; Ready to act; Paused
- Rule: Interest alone is not purchase intent.
- Ask: Is this active research or general curiosity?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P370 Purchase timing

- Selection: Single
- Values: Today; Within 1 week; Within 1 month; Within 3 months; Within 12 months; Later; No planned purchase
- Rule: Use an explicit reference date; these are authored bands.
- Ask: When is action expected?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P371 Decision progress

- Selection: Multiple
- Values: Requirements defined; Budget set; Options found; Comparison done; Approval pending; Trial pending; Ready
- Rule: Tasks need not occur in a fixed order.
- Ask: What remains unfinished?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P372 Shortlist status

- Selection: Single
- Values: No shortlist; Broad list; Few alternatives; One preferred option; Reopened search
- Rule: A preferred option is not a completed purchase.
- Ask: Which alternatives are still being considered?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P373 Comparison criteria

- Selection: Multiple
- Values: Price; Fit; Features; Quality; Reliability; Service; Convenience; Compatibility; Ongoing cost; Other
- Rule: Record only criteria actually stated or observed.
- Ask: What should the comparison answer?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P374 Purchase occasion

- Selection: Multiple
- Values: First purchase; Replacement; Upgrade; Gift; Life event; Replenishment; Emergency; Work need
- Rule: The same person can occupy several different purchase personas.
- Ask: Why is this purchase happening?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P375 User versus buyer role

- Selection: Multiple
- Values: End user; Researcher; Recommender; Decision-maker; Payer; Purchaser; Gatekeeper; Supporter
- Rule: Roles belong to a decision, not permanently to an identity.
- Ask: Who is asking, paying, and using?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P376 Question type needed

- Selection: Multiple
- Values: Definition; How-to; Requirements; Shortlist; Comparison; Price; Availability; Process; Troubleshooting
- Rule: Link a persona dimension to a useful question, not to invented search volume.
- Ask: Which question type would help next?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P377 Success criteria for the journey

- Selection: Text
- Values: Chosen option; Completed task; No purchase needed; Information gained; Problem resolved; Other
- Rule: Success does not always mean conversion.
- Ask: What would make this journey complete for the person?
- Scope: One goal, category, or purchase episode
- Evidence: Explicit current intent; observed events where permissioned
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 34 Triggers, barriers & urgency

### P378 Trigger event

- Selection: Multiple
- Values: Failure; New need; Life transition; New responsibility; New availability; Recommendation; Routine replacement; Other
- Rule: Record the event explicitly; do not infer private life events from browsing.
- Ask: What started the search?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P379 Main barrier

- Selection: Multiple
- Values: Budget; Time; Unclear options; Availability; Trust; Accessibility; Approval; Compatibility; Other
- Rule: A barrier is a design problem, not a persuasion opportunity.
- Ask: What prevents progress?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P380 Urgency reason

- Selection: Multiple
- Values: Essential task blocked; Deadline; Replacement; Convenience; Opportunity; No urgency
- Rule: Do not fabricate scarcity or fear.
- Ask: Why does timing matter?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P381 Constraint priority

- Selection: Repeated
- Values: Constraint; Hard limit or preference; Stated threshold; Evidence
- Rule: Hard limits and preferences must not be mixed.
- Ask: What cannot be compromised?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P382 Knowledge barrier

- Selection: Multiple
- Values: Terminology; Unknown requirements; Too many choices; Unclear terms; Missing comparison; No knowledge barrier
- Rule: Avoid equating uncertainty with low intelligence.
- Ask: Which explanation would remove confusion?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P383 Access barrier

- Selection: Multiple
- Values: Location; Transport; Connectivity; Language; Payment; Physical access; Service hours; Other
- Rule: Identify a workable alternative rather than excluding the person.
- Ask: What access route would work?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P384 Administrative barrier

- Selection: Multiple
- Values: Documentation; Approval; Account setup; Eligibility clarification; Booking process; Other
- Rule: Collect only necessary details; no legal eligibility conclusions from persona labels.
- Ask: Which administrative step is blocking progress?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P385 Emotional concern, voluntarily stated

- Selection: Multiple
- Values: Uncertainty; Frustration; Disappointment; Concern about regret; No stated concern; Other
- Rule: Do not infer psychological state or exploit distress.
- Ask: What reassurance or information is requested?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P386 Alternative to purchase

- Selection: Multiple
- Values: Repair; Borrow; Share; Delay; Change routine; Use existing product; No action
- Rule: Include nonpurchase options in a user-centered journey.
- Ask: Is a purchase actually necessary?
- Scope: Current situation; refresh when circumstances change
- Evidence: User-stated needs and obstacles; no inferred vulnerability
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 35 Payments & checkout preferences

### P387 Payment methods accessible

- Selection: Multiple
- Values: Cash; Debit; Credit card; Bank transfer; Mobile money; Digital wallet; Cash on delivery; Local method; Other
- Rule: Access is not preference; availability differs by market and provider.
- Ask: Which methods can the person actually use?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P388 Payment method preference

- Selection: Multiple
- Values: Cash; Card; Transfer; Mobile money; Wallet; Invoice; Other
- Rule: Ask directly; do not derive from nationality or income.
- Ask: How would the person prefer to pay?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P389 Banking access context

- Selection: Single
- Values: Bank account; Nonbank payment account; Mobile-money access; Shared financial access; No formal account
- Rule: Voluntary practical context, not a creditworthiness score.
- Ask: Is an account-free route needed?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P390 Prepaid versus billed preference

- Selection: Single
- Values: Prepaid; Pay as used; Postpaid; Either; Task-dependent
- Rule: Preference does not determine approval or legal eligibility.
- Ask: Which payment cycle is appropriate?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P391 Installment consideration

- Selection: Single
- Values: Not interested; Considering; Already arranged; Needs information; Not applicable
- Rule: Do not recommend credit or infer affordability.
- Ask: Are repayment terms an unanswered question?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P392 Checkout assistance

- Selection: Multiple
- Values: None; Plain instructions; Language help; Accessible flow; Trusted-person help; In-person completion
- Rule: Do not collect the helper's identity unless necessary.
- Ask: What support is needed to complete the transaction?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P393 Currency and cross-border needs

- Selection: Multiple
- Values: Local currency; Multiple currencies; Transparent conversion; Cross-border payment; No cross-border need
- Rule: Actual exchange rates and fees need transaction-time verification.
- Ask: Which currency and total charges should be clear?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P394 Receipt and invoice requirements

- Selection: Multiple
- Values: Paper receipt; Digital receipt; Business invoice; Tax details; Expense reimbursement; No preference
- Rule: Record local requirements without making tax conclusions.
- Ask: What proof of purchase is needed?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P395 Saved-payment preference

- Selection: Single
- Values: Never save; Save with permission; One-time token only; Provider-specific; Undecided
- Rule: Do not equate saved-card preference with blanket tracking permission.
- Ask: Should payment details persist?
- Scope: Transaction and market-specific
- Evidence: Voluntary preferences; no account, card, or identity-document numbers
- Handling: Sensitive / contextual
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

## 36 Delivery, service & usage context

### P396 Delivery or access method

- Selection: Multiple
- Values: Home delivery; Pickup; Store visit; Local agent; Digital access; On-site service; Remote service
- Rule: Physical address is unnecessary in a persona definition.
- Ask: How will the person receive the product or service?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P397 Delivery time flexibility

- Selection: Single
- Values: Fixed window needed; Day-specific; Flexible within a week; Flexible longer; Immediate digital access
- Rule: Task-specific; do not promise availability.
- Ask: What timing can the person accommodate?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P398 Installation and onboarding needs

- Selection: Multiple
- Values: Self-setup; Guided setup; Professional installation; Migration help; Accessibility setup; None
- Rule: Skill and willingness to self-install are separate.
- Ask: What is required to start using it?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P399 Support channel preference

- Selection: Multiple
- Values: Phone; Email; Chat; Messaging; Video; In-person; Community; Self-service
- Rule: Separate preference from actual provider availability.
- Ask: Which support channel works?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P400 Support language requirements

- Selection: Text
- Values: Any preferred language; Interpreter; Sign language; Plain-language support
- Rule: Do not assume support language from residence.
- Ask: In which language should support be provided?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P401 Support availability requirements

- Selection: Multiple
- Values: Business hours; Evenings; Weekends; Shift-compatible; Around-the-clock; Asynchronous
- Rule: Requirements are inputs, not guarantees of service.
- Ask: When must help be accessible?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P402 Maintenance responsibility

- Selection: Single
- Values: Self; Household member; Employer; Paid specialist; Managed provider; Shared
- Rule: Responsibility does not imply expertise.
- Ask: Who will maintain the product?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P403 Usage environment

- Selection: Multiple
- Values: Home; Workplace; School; Outdoors; Shared space; Mobile; High-wear environment; Other
- Rule: Use case directly informs specifications and questions.
- Ask: Where and under what conditions will it be used?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P404 Return and exit logistics

- Selection: Multiple
- Values: Store return; Mail return; Collection needed; Digital cancellation; Transfer; Disposal; Other
- Rule: Actual terms require current verification.
- Ask: How would the person undo or end the purchase?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P405 Service continuity needs

- Selection: Multiple
- Values: Backup access; Offline access; Replacement unit; Transferability; Data export; Portable plan; No stated need
- Rule: Capture continuity requirements rather than inferred risk.
- Ask: What happens if the service is interrupted?
- Scope: Specific product, location, and service encounter
- Evidence: Explicit logistical and support requirements
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 37 Customer relationship & retention

### P406 Relationship lifecycle

- Selection: Single
- Values: Unaware; Aware; Prospect; Trial user; New customer; Active customer; Lapsed customer; Former customer
- Rule: Define event and timing rules locally; not demographic persona categories.
- Ask: What relationship already exists?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P407 Category tenure

- Selection: Single
- Values: Never used; Under 1 month; 1-6 months; 7-12 months; 1-3 years; More than 3 years
- Rule: Framework bands; category experience is distinct from provider tenure.
- Ask: Is this a first-time user?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P408 Usage frequency after purchase

- Selection: Single
- Values: Not started; Rare; Monthly; Weekly; Daily; Multiple times daily
- Rule: Specify product and period.
- Ask: Is the product being used as intended?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P409 Satisfaction, self-reported

- Selection: Scale
- Values: Very dissatisfied; Dissatisfied; Neither; Satisfied; Very satisfied
- Rule: Direct feedback only; not inferred from silence or repeat purchase alone.
- Ask: What is or is not working?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P410 Value realization

- Selection: Single
- Values: Not yet realized; Partly realized; Meets expectations; Exceeds expectations; Not assessed
- Rule: Capture the person's stated outcome, not only seller-defined success.
- Ask: Has the original need been met?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P411 Renewal intention

- Selection: Single
- Values: Plans to renew; Undecided; Plans to stop; Not applicable
- Rule: Intent is not a forecast or completed renewal.
- Ask: What does renewal depend on?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P412 Switching barriers

- Selection: Multiple
- Values: Setup effort; Compatibility; Contract terms; Learning effort; Data transfer; Household agreement; None
- Rule: Use to reduce friction, not create lock-in.
- Ask: What would make switching difficult?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P413 Advocacy behavior

- Selection: Multiple
- Values: No advocacy; Private recommendation; Public review; Referral; Community help; Content creation
- Rule: Record actual action or stated willingness separately.
- Ask: How does the person share experience?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P414 Feedback preference

- Selection: Multiple
- Values: Brief survey; Detailed survey; Interview; Review; Support conversation; No feedback request
- Rule: Ask within permission and burden constraints.
- Ask: How does the person prefer to provide feedback?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P415 Exit reason

- Selection: Multiple
- Values: Need ended; Price; Poor fit; Quality; Support; Alternative; Relocation; Privacy; Other
- Rule: Do not force one reason when several apply.
- Ask: Why is the relationship ending?
- Scope: Relationship with a named category or provider; dated
- Evidence: First-party events and explicit feedback
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 38 Professional & organizational buying roles

### P416 Organizational role in purchase

- Selection: Multiple
- Values: User; Champion; Researcher; Technical evaluator; Procurement; Budget owner; Approver; Executive sponsor
- Rule: One person may hold several roles; job title alone is insufficient.
- Ask: What part of the decision does this person control?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P417 Organization context

- Selection: Single
- Values: Sole operator; Small team; Growing organization; Large organization; Public body; Nonprofit; Community group
- Rule: Authored descriptors; size definitions require local context.
- Ask: What organizational setting shapes the task?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P418 Organization industry

- Selection: Text
- Values: Any sector or local industry classification; Multiple sectors
- Rule: Do not substitute company industry for a person's occupation.
- Ask: Which operational requirements matter?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P419 Team or organization size

- Selection: Numeric
- Values: Headcount with defined scope and date
- Rule: Specify team versus entire organization and employees versus contractors.
- Ask: How many users or stakeholders are involved?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P420 Purchase authority

- Selection: Single
- Values: Can recommend; Can evaluate; Can spend within limit; Must obtain approval; Final approver
- Rule: Actual process matters more than seniority assumptions.
- Ask: Who must authorize the purchase?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P421 Organizational budget model

- Selection: Multiple
- Values: Per user; Per team; Per project; Department budget; Central budget; Reimbursed expense
- Rule: Separate company budget from personal income or wealth.
- Ask: How is this purchase funded?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P422 Procurement stage

- Selection: Single
- Values: Need definition; Requirements; Market review; Evaluation; Pilot; Approval; Contracting; Rollout; Renewal
- Rule: Authored model; organizations can skip or repeat stages.
- Ask: Which procurement task is current?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P423 Implementation constraints

- Selection: Multiple
- Values: Integration; Security review; Training; Migration; Staffing; Procurement rules; Accessibility; Other
- Rule: Requirements must be documented, not inferred from organization size.
- Ask: What could block implementation?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P424 Organizational success metrics

- Selection: Repeated
- Values: Metric; Baseline; Target; Owner; Evaluation period
- Rule: Targets are user-supplied, not invented ROI claims.
- Ask: How will the organization judge success?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P425 Business purchase risk concerns

- Selection: Multiple
- Values: Downtime; Cost overrun; Adoption; Compatibility; Support; Data handling; Vendor continuity
- Rule: Questions, not claims about a specific provider.
- Ask: What evidence must the buying group see?
- Scope: Person acting for an organization; not personal identity
- Evidence: Self-reported remit or verified organizational process
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 39 Nonbuyer roles & community participation

### P426 Noncommercial service role

- Selection: Multiple
- Values: Learner; Patient or care recipient; Applicant; Resident; Volunteer; Donor; Member; Service navigator
- Rule: A person's goal may have nothing to do with buying.
- Ask: What service outcome is sought?
- Scope: Person in a family, community, or service role
- Evidence: Voluntary role description; purpose-limited research
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P427 Community contribution

- Selection: Multiple
- Values: Volunteering; Mentoring; Mutual aid; Organizing; Teaching; Practical help; Financial support; None
- Rule: No political or religious affiliation is inferred.
- Ask: How does the person choose to contribute?
- Scope: Person in a family, community, or service role
- Evidence: Voluntary role description; purpose-limited research
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P428 Participation setting

- Selection: Multiple
- Values: Local community; School; Workplace; Club; Online group; International network; Family network
- Rule: Avoid private membership details unless necessary.
- Ask: Where does participation occur?
- Scope: Person in a family, community, or service role
- Evidence: Voluntary role description; purpose-limited research
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P429 Participation barriers

- Selection: Multiple
- Values: Time; Cost; Transport; Language; Accessibility; Scheduling; Unclear information; None
- Rule: Use to improve inclusion, not rank people.
- Ask: What would make participation possible?
- Scope: Person in a family, community, or service role
- Evidence: Voluntary role description; purpose-limited research
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P430 Learning or service decision role

- Selection: Multiple
- Values: Self; Guardian-supported; Family-supported; Professional-supported; Group decision
- Rule: Support roles do not imply lack of agency.
- Ask: Who needs clear information?
- Scope: Person in a family, community, or service role
- Evidence: Voluntary role description; purpose-limited research
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P431 Resource exchange mode

- Selection: Multiple
- Values: Paid exchange; Barter; Lending; Sharing; Volunteering; Informal reciprocity; Donation
- Rule: Include noncash economies and unpaid activities.
- Ask: Is money part of the exchange?
- Scope: Person in a family, community, or service role
- Evidence: Voluntary role description; purpose-limited research
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P432 Community connection preference

- Selection: Single
- Values: Local ties; Professional ties; Interest-based ties; Family network; Mixed; Private or independent
- Rule: Not a measure of loyalty or social worth.
- Ask: Which connections are relevant to this activity?
- Scope: Person in a family, community, or service role
- Evidence: Voluntary role description; purpose-limited research
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P433 Service success definition

- Selection: Text
- Values: Access achieved; Task completed; Skill gained; Support received; Participation enabled; Other
- Rule: Do not impose a purchase or revenue metric.
- Ask: What would a successful interaction mean?
- Scope: Person in a family, community, or service role
- Evidence: Voluntary role description; purpose-limited research
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 40 Situation, dynamics & change over time

### P434 Persona application context

- Selection: Single
- Values: Personal use; Household use; Caregiving; Work; Community role; Travel; Other
- Rule: The same person can need different profiles in different contexts.
- Ask: Which version of the person's situation matters now?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P435 Trait stability

- Selection: Single
- Values: Relatively stable; Slowly changing; Seasonal; Situation-specific; Momentary
- Rule: A metadata label for a dimension, not a psychological diagnosis.
- Ask: How quickly can this value change?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P436 Observation date and validity

- Selection: Text
- Values: As-of date; Validity window; Last confirmation date
- Rule: Do not reuse a stale value as current without qualification.
- Ask: Is this context still accurate?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P437 Life-event impact

- Selection: Multiple
- Values: Time changed; Budget changed; Household changed; Location changed; Access changed; Priorities changed; None
- Rule: Record practical effects rather than inferring private events.
- Ask: Which constraints have changed?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P438 Role-specific differences

- Selection: Repeated
- Values: Role; Different goal; Different budget; Different channel; Different decision process
- Rule: Preserve legitimate differences rather than averaging them away.
- Ask: Does work behavior differ from personal behavior?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P439 Category-specific differences

- Selection: Repeated
- Values: Category; Price orientation; Luxury preference; Knowledge; Research depth; Channel
- Rule: A value-focused grocery buyer may choose premium travel, or the reverse.
- Ask: Which preferences change by category?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P440 Seasonal or cyclical context

- Selection: Multiple
- Values: School cycle; Work cycle; Pay cycle; Weather; Festivals; Care schedule; Other
- Rule: Local calendars and routines differ.
- Ask: Is this a recurring change?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P441 Current task environment

- Selection: Multiple
- Values: At home; At work; In transit; In store; Shared space; Low bandwidth; Interrupted; Other
- Rule: Context is temporary and should not become a permanent identity label.
- Ask: What is possible in this moment?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P442 Conflicting preferences

- Selection: Text
- Values: Preference A; Preference B; Trade-off; Context that decides
- Rule: People can hold competing needs; do not force a single label.
- Ask: Which trade-off needs clarification?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P443 Persona update trigger

- Selection: Multiple
- Values: User correction; New evidence; Life change; Category change; Periodic review; Expired data
- Rule: Update only with permitted information and retain provenance.
- Ask: When should this persona be revised?
- Scope: Date, role, location, and specific episode
- Evidence: Time-stamped self-report or permissioned observations
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

## 41 Evidence, confidence & responsible use

### P444 Record type

- Selection: Single
- Values: Fictional scenario; Individual self-report; Individual observation; Aggregate segment; Model estimate
- Rule: Never present fictional combinations as measured human populations.
- Ask: What kind of persona record is this?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P445 Evidence status

- Selection: Single
- Values: Self-reported; Observed with permission; Measured aggregate; Derived; Estimated; Hypothesis; Unknown
- Rule: These are different evidence types, not an automatic quality ranking.
- Ask: How is this specific value known?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P446 Evidence source and date

- Selection: Text
- Values: Source name or URL; Collection date; Reference period; Dataset version
- Rule: A citation must support the exact population and variable being used.
- Ask: Where can the claim be checked?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P447 Population definition

- Selection: Text
- Values: Country or area; Age range; Unit; Inclusion criteria; Sampling frame
- Rule: Aggregate findings do not automatically describe every individual.
- Ask: Who does this evidence actually represent?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P448 Measurement unit and scale

- Selection: Text
- Values: Currency; Period; Person or household; Numeric scale; Question wording
- Rule: Comparisons require compatible definitions.
- Ask: Are the measures like-for-like?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P449 Uncertainty documentation

- Selection: Text
- Values: Sample size; Error estimate if reported; Missingness; Model assumptions; Not quantified
- Rule: Do not invent margins of error or confidence scores.
- Ask: What uncertainty should users see?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P450 Permission and intended purpose

- Selection: Text
- Values: Allowed purpose; Data source permission; Restrictions; Review owner
- Rule: This is a recordkeeping field, not a universal legal-consent mechanism.
- Ask: Is this use within the documented permission?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P451 Collection necessity

- Selection: Single
- Values: Necessary for task; Useful but optional; Not necessary; Not assessed
- Rule: A large taxonomy is not a requirement to collect every field.
- Ask: Can the task work without this information?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P452 Operational sensitivity flag

- Selection: Single
- Values: Standard context; Personal; Sensitive; Restricted; Not assessed
- Rule: Flags in this workbook are design safeguards, not legal classifications across jurisdictions.
- Ask: Who should have access?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P453 Missing-value state

- Selection: Single
- Values: Unknown; Not asked; Not applicable; Prefer not to say; Unavailable; Withheld
- Rule: Keep missing values separate from zero, none, or lack of interest.
- Ask: Why is the field empty?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P454 Inference restriction

- Selection: Multiple
- Values: No demographic inference; No sensitive-trait inference; No individualization of aggregate data; No automated decision use
- Rule: Do not turn browsing, postcode, name, or language into hidden identity claims.
- Ask: What must not be inferred?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P455 Retention and refresh rule

- Selection: Text
- Values: Retention limit; Expiry date; Refresh schedule; Deletion trigger
- Rule: Follow the actual permitted purpose and applicable requirements; not a legal retention recommendation.
- Ask: When should this record be deleted or refreshed?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

### P456 Human correction and review

- Selection: Text
- Values: Correction route; Review owner; Last review; Unresolved disagreement
- Rule: Preserve the person's own description and allow correction.
- Ask: How can an incorrect persona be corrected?
- Scope: Metadata for each populated value or persona
- Evidence: Research records; explicit permissions; source documentation
- Handling: Personal / minimize
- Basis: Data-minimization design reference: ICO. Not a global legal-compliance checklist. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/

## 42 Extension & composite-persona rules

### P457 Custom dimension

- Selection: Text
- Values: New dimension name; Definition; Scope; Unit; Allowed values
- Rule: Use when a relevant human attribute or context is not represented.
- Ask: What necessary dimension is missing?
- Scope: Framework design; applies across all domains
- Evidence: Documented project-specific definitions
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P458 Custom category or local term

- Selection: Text
- Values: Original local label; Explanation; Optional translated label; Parent category
- Rule: Do not discard local meaning to force a global label.
- Ask: Which local category needs preserving?
- Scope: Framework design; applies across all domains
- Evidence: Documented project-specific definitions
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P459 Multi-select combination rule

- Selection: Text
- Values: Any compatible values; Explicit exclusivity rule; Context-specific combinations
- Rule: Multiple identities, interests, roles, and needs can coexist.
- Ask: Are the chosen values actually incompatible?
- Scope: Framework design; applies across all domains
- Evidence: Documented project-specific definitions
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P460 Composite persona description

- Selection: Text
- Values: Relevant dimensions plus explicit goal, category, constraints, role, and date
- Rule: Do not invent a stereotypical name, motive, or biography to fill gaps.
- Ask: How can the known context be summarized faithfully?
- Scope: Framework design; applies across all domains
- Evidence: Documented project-specific definitions
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P461 Segment membership rule

- Selection: Text
- Values: Declared inclusion criteria; Overlap policy; Evidence source; Reference period
- Rule: A segment is only mutually exclusive when explicitly designed that way.
- Ask: Which people meet this particular definition?
- Scope: Framework design; applies across all domains
- Evidence: Documented project-specific definitions
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P462 Query fan-out construction

- Selection: Text
- Values: Seed question + stated use case + constraints + role + journey stage
- Rule: Output possible questions as hypotheses unless observed in genuine query data.
- Ask: Which specific next question follows from an explicit need?
- Scope: Framework design; applies across all domains
- Evidence: Documented project-specific definitions
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.

### P463 Validation plan for a persona

- Selection: Multiple
- Values: Interview; Survey; Diary; Usability test; Consented query data; Transaction analysis; Expert review
- Rule: Validate the actual combination; independent marginal statistics do not establish a joint persona.
- Ask: What evidence would confirm or revise this persona?
- Scope: Framework design; applies across all domains
- Evidence: Documented project-specific definitions
- Handling: Personal / minimize
- Basis: Authored classification; illustrative, extensible options. No population estimates.
