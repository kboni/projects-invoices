import { getTotalSumOfAllProjectCosts } from "@reactapp/services/project.service";
import { getTotalSumOfAllSectionCosts } from "@reactapp/services/section.service";
import { formatCurrency } from "@reactapp/utils/utils";
import React, { useState } from "react";

export default function GrandTotalComponent() {
  const [total, setTotal] = useState('');
  
  const projectTotalPromise = getTotalSumOfAllProjectCosts()
  const sectionTotalPromise = getTotalSumOfAllSectionCosts()
  
  Promise.all([projectTotalPromise, sectionTotalPromise])
  .then(([projectTotal, sectionTotal]) => {
    setTotal(formatCurrency(projectTotal[0].projectCost + sectionTotal[0].sectionCost));
    console.log('SETTING TOTAL AGAIN')
  })

  return (
    <div>
      <p>
        <span style={{color: "cornflowerblue"}}>Ukupan iznos svih projekata i sekcija: {total}</span>
      </p>
    </div>
  )
}