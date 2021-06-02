import Link from "next/link";

import style from './buttomClosePreview.module.scss'

export function ButtomClosePreview() {
  return (

    <Link href="/api/exit-preview">
      <a>
        <div className={style.buttomClose}>
          Sair do modo Preview
        </div>
      </a>
    </Link>
  )
}