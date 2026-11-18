// Editorial overlays and shot grammar are driven by the same measured film clock.
// The objects carry the mechanism; these short labels supply context and attribution.
const language = {
  'design:drawing': ['1987 · TSMC', "Someone else's chip", 'A factory whose future depends on its customers.', 'Founding date: 1994 annual report · Customer thesis: Chang, 2007'],
  'design:alternatives': ['THE DESIGNER’S CHOICE', 'Build a factory. Or trust a supplier.', '', 'Illustrative business relationship'],
  'boundary:open': ['THE FOUNDRY’S BET', 'Make the chip. Don’t sell a rival.', '', 'Own-brand IC restriction described in TSMC’s 1994 report'],
  'archive:1985': ['TAIWAN · 1985', 'Where could a new company compete?', 'K. T. Li asks Morris Chang for a plan.', 'Chang’s retrospective account · CHM oral history, 2007'],
  'design:separate': ['A DIFFERENT SPECIALTY', 'Separate the product from its manufacture.', '', 'Chang’s retrospective account · CHM, 2007'],
  'capacity:empty': ['THE CUSTOMER PROBLEM', 'Overflow is not commitment.', 'Orders can leave when the customer’s own factory has room.', 'Chang’s retrospective assessment · Not historical order data'],
  'capacity:withdraw': ['THE CUSTOMER PROBLEM', 'The order can leave. The factory stays.', '', 'Schematic capacity · No actual quantities represented'],
  'design:independent': ['A MARKET STILL FORMING', 'What if the designer had no factory?', '', 'Chang’s proposed customer thesis · CHM, 2007'],
  'archive:capital': ['1987 · INITIAL INVESTMENT', 'About US$220 million', 'Specializing in manufacturing did not make the factory cheap.', 'Approximate retrospective figure · Chang–Huang conversation, 2007'],
  'archive:partners': ['CAPITAL WAS ONLY PART OF THE START', 'Institutions, technology, people.', '', 'Capital shares: Chang, 2007 · Spin-off: ITRI, 2023'],
  'archive:contracts': ['1987 · REPORTED AGREEMENTS', 'Technology meets a place to make it.', 'Philips: technology cooperation · ITRI: buildings and equipment', 'TSMC 1994 annual report · Important Contracts, p. 15'],
  'archive:charter': ['THE BOUNDARY, IN WRITING', 'No own-brand IC end products.', 'A stated restriction on the manufacturer’s own competing product.', 'TSMC 1994 annual report · Company Background, p. 5'],
  'boundary:close': ['ONE CONFLICT REMOVED', 'The design enters. A rival product does not.', '', 'Explanatory model of the stated own-brand restriction'],
  'boundary:return': ['A LIMIT, NOT A FAIRY TALE', 'No rival product ≠ no commercial interests.', '', 'Editorial interpretation · Pricing and investment decisions remain'],
  'design:fit': ['THE ENGINEERING INTERFACE', 'A design must fit a process.', '', 'Process-specific information · TSMC public iPDK / iDRC description'],
  'design:violation': ['DESIGN RULES', 'Too close to reproduce reliably.', 'A qualitative spacing example. No actual process dimension.', 'Illustrative rule violation · Not a customer circuit'],
  'design:repair': ['BEFORE PRODUCTION', 'Change the layout, before making the wafer.', '', 'Illustrative design correction · No actual rule value'],
  'layers:assembled': ['THE PHYSICAL OBLIGATION', 'The right material. In the right place.', '', 'Exaggerated process illustration · Not a fabrication recipe'],
  'layers:explode': ['FROM DRAWING TO STRUCTURE', 'The layers have to work together.', '', 'Schematic cross-section · Not to scale'],
  'fab:establish': ['INSIDE THE MANUFACTURER’S JOB', 'A controlled process, not a rented machine.', '', 'Authored modern fab · Not TSMC footage or a 1987 reconstruction'],
  'fab:handoff': ['ONE PHYSICAL HANDOFF', 'Supported. Lowered. Released.', '', 'Authored mechanical illustration'],
  'fab:detail': ['SECONDS OF MOVEMENT', 'Years of process capability.', '', 'Authored modern fab · Not actual facility geometry'],
  'layers:coat': ['01 · COAT', 'Put a sensitive layer over the material.', '', 'Selected process steps · ASML public manufacturing explanation'],
  'layers:pattern': ['02 · DEFINE', 'Keep the pattern. Open the surrounding area.', '', 'Positive-tone schematic · Optics and recipe omitted'],
  'layers:etch': ['03 · TRANSFER', 'Remove the exposed material.', '', 'Subtractive illustration · Not a TSMC copper process recipe'],
  'layers:align': ['REGISTRATION · TWO OUTCOMES', 'One connection. Two very different results.', 'Misregistered / correctly registered — a comparison, not a repair.', 'Exaggerated displacement · No physical layer is repaired by sliding it'],
  'testing:unmeasured': ['APPEARANCE IS NOT PERFORMANCE', 'Which devices actually work?', '', 'Fabricated explanatory map · Not a yield dataset'],
  'testing:probe': ['ELECTRICAL CONTACT', 'Touch the device. Test the result.', '', 'Probing mechanism · Illustrative contact geometry'],
  'testing:results': ['FROM WAFER TO USABLE OUTPUT', 'The customer needs working devices.', '', 'Pass / fail marks are illustrative, not TSMC’s measured yield'],
  'testing:selected': ['REPEATABLE OUTPUT', 'A reason to place the next order.', '', 'Editorial interpretation · Not a reliability guarantee'],
  'capacity:shared': ['A SPECIALIST, MANY DESIGNS', 'The factory becomes the business.', '', 'Schematic relationship · No customer volume or capacity claim'],
  'capacity:growth': ['BACK TO THE EARLY YEARS · 1991–92', 'Independent designers become customers.', '', 'Growth acceleration recalled by Chang · CHM oral history, 2007'],
  'archive:cirrus': ['23 SEPTEMBER 1993', 'Cirrus Logic: a continuing commitment.', 'A deposit and supply agreement for wafer products.', 'TSMC 1994 annual report · Important Contracts, p. 15'],
  'archive:visit': ['A CUSTOMER’S RECOLLECTION', 'How large is the next design?', 'Jensen Huang describes Chang’s visits and wafer-demand discussions.', 'CHM conversation, 2007 · Visit dates and quantities not established'],
  'capacity:queue': ['SHARED DOES NOT MEAN UNLIMITED', 'Several customers. Finite production.', '', 'Illustrative queue · Not an actual allocation decision'],
  'capacity:risk': ['A DIFFERENT DEPENDENCY', 'Your design. Someone else’s schedule.', '', 'Editorial model · Not an account of a historical shortage'],
  'boundary:risk': ['THE LIMIT OF THE PROMISE', 'Not your competitor. Still your dependency.', '', 'Noncompetition does not guarantee price, capacity or continuity'],
  'return:die': ['THE DESIGN FROM THE OPENING', 'Still the customer’s product.', '', 'The same authored L motif · Not a functioning circuit'],
  'return:package': ['TWO DIFFERENT RESPONSIBILITIES', 'What to make. How to make it.', '', 'Cutaway package illustration · Not an actual commercial package'],
  'return:together': ['THE CUSTOMER’S NEXT DESIGN', 'The factory’s next future.', '', 'Editorial interpretation of Huang’s separate customer account'],
  'return:final': ['THE FOUNDRY RELATIONSHIP', 'Their next chip. Your business.', '', 'CHIP IN BIRDIE · S1E01']
};

export function shotGrammar(shot) {
  const key=shot.world+':'+shot.phase;
  const size=/drawing|violation|repair|probe|align|die/.test(shot.phase)?'ECU':/alternatives|independent|empty|queue|risk|final/.test(shot.phase)?'W':/pattern|partners|results/.test(shot.phase)?'O/H':'M/CU';
  return {size,cut:'hard',motive:language[key]?.[1]||'Follow the physical change and its consequence'};
}

export function updateCinema($, row, shot, time) {
  const spec=language[shot.world+':'+shot.phase]||['','','',''];
  const elapsed=time-shot.t0;
  // A headline establishes a shot, then lets the object carry the remainder.
  const opacity=elapsed<5.5?1:Math.max(.56,1-(elapsed-5.5)*.12);
  $('scene-kicker').textContent=spec[0];
  $('scene-caption').textContent=spec[1];
  $('scene-detail').textContent=spec[2];
  $('scene-title').style.opacity=String(opacity);
  $('record-label').textContent=spec[3];
  $('picture').dataset.world=shot.world;
  const metric=$('capital-shares');
  metric.hidden=shot.phase!=='partners'||row.id!=='s17';
  // The values are Chang's approximate retrospective shares, not audited accounts.
  if(!metric.hidden)metric.setAttribute('aria-label','Initial capital: Taiwan government 48 percent; Philips approximately 27 percent; other Taiwanese investors approximately 25 percent.');
}
