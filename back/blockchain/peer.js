class Peer {
    static Array = class PeerArray extends Array {
        static fromJson(data) {
            let peers = new PeerArray();
            data.forEach((peer) => peers.push(peer));
            return peers;
        }
    }
}

module.exports = Peer;