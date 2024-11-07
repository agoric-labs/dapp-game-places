import nextjsLog from '../../../public/nextjs.svg';
import agoricLogo from '../../../public/agoric.svg';
import Image from 'next/image';

const Logos = () => (
  <div>
    <a href="https://nextjs.org" target="_blank">
      <Image
        priority
        src={nextjsLog}
        alt="Next.js logo"
        width={64}
        height={64}
      />
    </a>
    <a href="https://agoric.com/develop" target="_blank">
      <Image
        priority
        src={agoricLogo}
        alt="Agoric logo"
        width={64}
        height={64}
      />
      {/* <img src={agoricLogo} className="logo agoric" alt="Agoric logo" /> */}
    </a>
  </div>
);

export { Logos };
