import React from 'react'
import { Youtube, Instagram, MessageCircle } from 'lucide-react'

const ORG_NAME = 'SWEET MAP'
const COMPANY = 'S.H 엔터테인먼트'
const OWNER = '한승호'
const ADDRESS = '전라특별자치도 전주시 완산구 세내로 239, 포스코'
const TEL = '010-4674-0787'
const FAX = '010-4674-0787'
const BIZNO = '010-4674-0787'

const Footer: React.FC = () => (
  <footer className="site-footer">
    <div className="footer-wrap">
      <div className="footer-grid">
        <div className="footer-left">
          <div className="footer-logo">{ORG_NAME}</div>
          <div className="footer-social">
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube"><Youtube size={18} /></a>
            <a href="https://www.instagram.com/ho___03/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram"><Instagram size={18} /></a>
            <a href="https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox?compose=new" target="_blank" rel="noopener noreferrer" aria-label="Message" title="Message"><MessageCircle size={18} /></a>
          </div>
        </div>
        <div className="footer-col">
          <div className="col-title">Use cases</div>
          <ul>
            <li>Dessert lovers</li>
            <li>Atmosphere seekers</li>
            <li>Solo working</li>
            <li>Date spots</li>
          </ul>
        </div>
        <div className="footer-col">
          <div className="col-title">Explore</div>
          <ul>
            <li>Map</li>
            <li>Top picks</li>
            <li>Communities</li>
            <li>Favorites</li>
          </ul>
        </div>
        <div className="footer-col">
          <div className="col-title">Resources</div>
          <ul>
            <li>Blog</li>
            <li>Support</li>
            <li>Developers</li>
            <li>Guides</li>
          </ul>
        </div>
      </div>

      <div className="footer-company">
        {ADDRESS} | {COMPANY} | 대표자 : {OWNER}
        <br />
        TEL {TEL} | 팩스 {FAX} | 사업자번호 : {BIZNO}
      </div>
      <div className="footer-links">
        <span>이용약관</span>
        <span style={{ fontWeight: 800 }}>개인정보처리방침</span>
        <span>제휴/제안</span>
        <span>회사소개</span>
      </div>
      <div className="footer-copy">Copyright © {new Date().getFullYear()} {ORG_NAME}. All rights reserved.</div>
    </div>
  </footer>
)

export default Footer
