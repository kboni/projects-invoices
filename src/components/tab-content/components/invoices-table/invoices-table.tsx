import React from 'react';
import '../../../../../assets/style/invoice-table.css'

export default function InvoicesTableComponent() {
  return (
    <table>
      <thead>
        <tr>
          <td>#</td>
          <td>Name</td>
          <td>Value</td>
          <td>Description</td>
          <td>File</td>
          <td>Label</td>
        </tr>
      </thead>
    </table>
  )
}