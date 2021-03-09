import { DBTableName } from "@reactapp/models/database-table.enum";
import { getTotalSumOfAllProjectCosts } from "@reactapp/services/project.service";
import { formatCurrency } from "@reactapp/utils/utils";
import React, { useState } from "react";

export default function GrandTotalComponent() {
  const [total, setTotal] = useState('');
  
  const projectTotalPromise = getTotalSumOfAllProjectCosts(DBTableName.PROJECT);
  const sectionTotalPromise = getTotalSumOfAllProjectCosts(DBTableName.SECTION);
  
  Promise.all([projectTotalPromise, sectionTotalPromise])
  .then(([projectTotal, sectionTotal]) => {
    setTotal(formatCurrency(projectTotal[0].totalCost + sectionTotal[0].totalCost));
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